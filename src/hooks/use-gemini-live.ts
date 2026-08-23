import { useState, useEffect, useRef, useCallback } from 'react';
import { globalAudioPlayer } from '../utils/audio-player';

export type Message = {
  role: 'user' | 'model';
  text: string;
};

const MAX_RETRIES = 3;
const SESSION_KEY = 'extrajus_voice_session';

type SavedVoiceSession = {
  history: Message[];
  isActive: boolean;
  sessionId: string;
  resumptionHandle?: string | null;
  timestamp: number;
};

function getSessionKey(documentId?: string | null) {
  return documentId ? `${SESSION_KEY}_${documentId}` : SESSION_KEY;
}

function saveVoiceSession(
  history: Message[],
  isActive: boolean,
  sessionId: string,
  resumptionHandle?: string | null,
  documentId?: string | null
) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getSessionKey(documentId), JSON.stringify({
      history: history.slice(-20),
      isActive,
      sessionId,
      resumptionHandle,
      timestamp: Date.now(),
    }));
  } catch {}
}

function loadVoiceSession(documentId?: string | null): SavedVoiceSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(getSessionKey(documentId));
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedVoiceSession;
    if (Date.now() - data.timestamp > 7200_000) {
      return { ...data, isActive: false, resumptionHandle: null };
    }
    return data;
  } catch {
    return null;
  }
}

export function useGeminiLive(
  onRedirect?: (facts: string) => void,
  setupEndpoint: string = '/api/config/gemini-live-setup',
  onToolCall?: (name: string, args: any) => void,
  extraContext?: string,
  documentId?: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const sessionIdRef = useRef(`extrajus_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const resumptionHandleRef = useRef<string | null>(null);
  const sessionRestoredRef = useRef(false);
  const documentIdRef = useRef(documentId);

  useEffect(() => {
    documentIdRef.current = documentId;
    const saved = loadVoiceSession(documentId);
    if (saved) {
      setMessages(saved.history || []);
      if (saved.sessionId) sessionIdRef.current = saved.sessionId;
      if (saved.resumptionHandle) resumptionHandleRef.current = saved.resumptionHandle;
    } else {
      setMessages([]);
      sessionIdRef.current = `extrajus_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      resumptionHandleRef.current = null;
    }
    sessionRestoredRef.current = true;
  }, [documentId]);

  useEffect(() => {
    setIsMuted(false);
    localStorage.setItem('extrajus_mute', 'false');
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setAudioLevel(0);
      return;
    }

    let animId: number;
    let lastUpdate = 0;
    // Throttle to ~20fps (50ms) to avoid hammering re-renders on mobile
    const THROTTLE_MS = 50;
    const updateOutputVolume = (now: number) => {
      if (now - lastUpdate >= THROTTLE_MS) {
        lastUpdate = now;
        setAudioLevel(globalAudioPlayer.getVolume());
      }
      animId = requestAnimationFrame(updateOutputVolume);
    };
    
    animId = requestAnimationFrame(updateOutputVolume);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isConnected]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('extrajus_mute', String(newVal));
      if (newVal) {
        globalAudioPlayer.stop();
      } else {
        globalAudioPlayer.init();
      }
      return newVal;
    });
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const retryCountRef = useRef(0);
  const messagesRef = useRef(messages);
  const onRedirectRef = useRef(onRedirect);
  const onToolCallRef = useRef(onToolCall);
  const setupEndpointRef = useRef(setupEndpoint);
  const extraContextRef = useRef(extraContext);
  const pingIntervalRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const pendingRedirectRef = useRef<{ facts: string } | null>(null);
  const pendingDisconnectRef = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { onRedirectRef.current = onRedirect; }, [onRedirect]);
  useEffect(() => { onToolCallRef.current = onToolCall; }, [onToolCall]);
  useEffect(() => { setupEndpointRef.current = setupEndpoint; }, [setupEndpoint]);
  useEffect(() => { extraContextRef.current = extraContext; }, [extraContext]);

  const persistResumptionHandle = useCallback((handle: string) => {
    if (handle === resumptionHandleRef.current) return;
    resumptionHandleRef.current = handle;
  }, []);

  const persistSession = useCallback((isActive: boolean) => {
    saveVoiceSession(
      messagesRef.current,
      isActive,
      sessionIdRef.current,
      resumptionHandleRef.current,
      documentIdRef.current
    );
  }, []);

  const stopLiveDialog = useCallback(() => {
    shouldReconnectRef.current = false;
    retryCountRef.current = MAX_RETRIES;

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    persistSession(false);

    if (wsRef.current) {
      wsRef.current.close(1000, "User stopped");
      wsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
    isConnectingRef.current = false;
    globalAudioPlayer.stop();
  }, [persistSession]);

  const connect = useCallback(async () => {
    if (wsRef.current || isConnectingRef.current) return;

    shouldReconnectRef.current = true;
    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);
    setMicError(null);

    try {
      setMessages([]);
      const res = await fetch(`${setupEndpointRef.current}?sessionId=${sessionIdRef.current}`);
      if (!res.ok) throw new Error('Falha ao buscar configuração da API.');
      const config = await res.json();
      if (!config.key) throw new Error('API Key não encontrada no setup.');

      await globalAudioPlayer.init();
      const audioCtx = globalAudioPlayer.audioContext as AudioContext;

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${config.key}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let setupComplete = false;
      let audioPipelineStarted = false;

      const startAudioPipeline = async () => {
        if (audioPipelineStarted || ws.readyState !== WebSocket.OPEN) return;
        audioPipelineStarted = true;

        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
          micStreamRef.current = micStream;

          const micSource = audioCtx.createMediaStreamSource(micStream);
          const scriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
          scriptNodeRef.current = scriptNode;

          const inputSampleRate = audioCtx.sampleRate;

          scriptNode.onaudioprocess = (e) => {
            try {
              if (ws.readyState !== WebSocket.OPEN) return;

              const inputData = e.inputBuffer.getChannelData(0);

              // Microphone rms tracking disabled to prevent ripples when user speaks

              const ratio = inputSampleRate / 16000;
              const newLength = Math.round(inputData.length / ratio);
              const pcmData = new Int16Array(newLength);

              let offsetResult = 0;
              let offsetInput = 0;

              while (offsetResult < pcmData.length) {
                const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
                let accum = 0;
                let count = 0;
                for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
                  accum += inputData[i];
                  count++;
                }
                const sample = count > 0 ? accum / count : 0;
                pcmData[offsetResult] = Math.max(-32768, Math.min(32767, sample * 32767));
                offsetResult++;
                offsetInput = nextOffsetInput;
              }

              const bytes = new Uint8Array(pcmData.buffer);
              let binary = "";
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = window.btoa(binary);

              ws.send(JSON.stringify({
                realtimeInput: {
                  audio: {
                    data: base64,
                    mimeType: "audio/pcm;rate=16000",
                  },
                },
              }));
            } catch (processErr) {
              console.error("[Áudio] Erro no processamento do áudio:", processErr);
            }
          };

          micSource.connect(scriptNode);
          scriptNode.connect(audioCtx.destination);
          setIsRecording(true);
          setMicError(null);
        } catch (micErr: any) {
          console.error("Erro microfone:", micErr);
          if (micErr.name === 'NotAllowedError') {
            setMicError("Permissão do microfone negada. Permita o acesso nas configurações do navegador.");
          } else if (micErr.name === 'NotFoundError') {
            setMicError("Nenhum microfone encontrado no dispositivo.");
          } else {
            setMicError("Erro ao acessar o microfone: " + micErr.message);
          }
        }
      };

      ws.onopen = () => {
        console.log("[WS] Aberto! Enviando Setup...");
        setIsConnected(true);
        isConnectingRef.current = false;
        setIsConnecting(false);
        retryCountRef.current = 0;

        const tools = [...(config.tools || [])];
        tools.push({
          functionDeclarations: [
            {
              name: "desligar_conexao",
              description: "Encerra a chamada, finaliza o diálogo por voz em tempo real e desliga a conexão de áudio. Deve ser chamada imediatamente quando o usuário pedir para parar, encerrar, finalizar ou desligar.",
              parameters: {
                type: "OBJECT",
                properties: {},
              },
            },
          ],
        });

        const systemInstructionParts = [{ text: config.systemInstruction }];
        
        // Apenas envia a petição inteira como contexto na PRIMEIRA conexão (sem resume handle)
        // Isso economiza milhares de tokens, pois nas conexões subsequentes a IA já lembrará do contexto nativamente.
        if (extraContextRef.current && !resumptionHandleRef.current) {
          systemInstructionParts.push({ text: `\n\nCONTEXTO DO DOCUMENTO ATUAL:\n${extraContextRef.current}` });
          console.log("[WS] Novo contexto injetado no system instruction.");
        } else if (resumptionHandleRef.current) {
          console.log("[WS] Sessão retomada. Contexto omitido para economizar tokens.");
        }

        ws.send(JSON.stringify({
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            systemInstruction: { parts: systemInstructionParts },
            tools,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Leda" },
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            sessionResumption: resumptionHandleRef.current ? { handle: resumptionHandleRef.current } : {},
          },
        }));
      };

      ws.onmessage = async (event) => {
        try {
          let dataText = event.data;
          if (event.data instanceof Blob) dataText = await event.data.text();
          const response = JSON.parse(dataText);

          if (response.setupComplete) {
            setupComplete = true;
            await startAudioPipeline();
            return;
          }

          const resumptionUpdate = response.sessionResumptionUpdate;
          if (resumptionUpdate?.resumable && resumptionUpdate?.newHandle) {
            persistResumptionHandle(resumptionUpdate.newHandle);
          }

          if (response.serverContent?.interrupted) {
            globalAudioPlayer.stop();
            return;
          }

          const handleToolCallEvent = async (call: any) => {
            if (call.name === "redirecionar_editor_tiptap") {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [
                      {
                        name: call.name,
                        id: call.id,
                        response: { output: { success: true } }
                      }
                    ]
                  }
                }));
              }
              pendingRedirectRef.current = { facts: call.args?.contexto_geral };
            } else if (call.name === "desligar_conexao") {
              console.log("[WS] Desligamento solicitado via tool call.");
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [
                      {
                        name: call.name,
                        id: call.id,
                        response: { output: { success: true } }
                      }
                    ]
                  }
                }));
              }
              pendingDisconnectRef.current = true;
            } else if (onToolCallRef.current) {
              // Executa a função em background sem pausar a IA (de forma síncrona para o WebSocket)
              Promise.resolve(onToolCallRef.current(call.name, call.args)).catch(console.error);
              
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [
                      {
                        name: call.name,
                        id: call.id,
                        response: {
                          output: {
                            success: true,
                            message: "A solicitação foi adicionada à fila de processamento assíncrono e será aplicada no documento em breve. Você pode continuar conversando normalmente com o usuário."
                          }
                        }
                      }
                    ]
                  }
                }));
              }
            }
          };

          if (response.toolCall) {
            const calls = response.toolCall.functionCalls || [];
            for (const call of calls) {
              await handleToolCallEvent(call);
            }
          }

          const parts = response.serverContent?.modelTurn?.parts ||
                        response.serverContent?.parts ||
                        response.modelTurn?.parts;

          if (parts && Array.isArray(parts)) {
            for (const p of parts) {
              if (p.functionCall) {
                await handleToolCallEvent(p.functionCall);
              }
              if (p.inlineData?.mimeType?.startsWith("audio/")) {
                globalAudioPlayer.addPcm16Chunk(p.inlineData.data);
              }
              if (p.text) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.role === 'model') {
                    lastMsg.text += p.text;
                  } else {
                    newMessages.push({ role: 'model', text: p.text });
                  }
                  return newMessages;
                });
              }
            }
          }

          if (response.serverContent?.inputTranscription?.text) {
            const userText = response.serverContent.inputTranscription.text;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg && lastMsg.role === 'user') {
                lastMsg.text += userText;
              } else {
                newMessages.push({ role: 'user', text: userText });
              }
              return newMessages;
            });
          }

          if (response.serverContent?.outputTranscription?.text) {
            const modelText = response.serverContent.outputTranscription.text;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg && lastMsg.role === 'model') {
                lastMsg.text += modelText;
              } else {
                newMessages.push({ role: 'model', text: modelText });
              }
              return newMessages;
            });
          }

          if (response.serverContent?.turnComplete) {
            persistSession(true);
            if (pendingRedirectRef.current) {
              const facts = pendingRedirectRef.current.facts;
              pendingRedirectRef.current = null;
              (async () => {
                await globalAudioPlayer.waitForPlaybackEnd();
                onRedirectRef.current?.(facts);
              })();
            }
            if (pendingDisconnectRef.current) {
              pendingDisconnectRef.current = false;
              (async () => {
                await globalAudioPlayer.waitForPlaybackEnd();
                stopLiveDialog();
              })();
            }
          }
        } catch (err) {
          console.error("Erro parse WS", err);
        }
      };

      ws.onclose = (event) => {
        if (!setupComplete && resumptionHandleRef.current) {
          console.warn("[WS] Falha ao retomar sessão. Descartando handle de resumo.");
          resumptionHandleRef.current = null;
        }

        isConnectingRef.current = false;
        setIsConnecting(false);
        setIsConnected(false);
        setIsRecording(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
          micStreamRef.current = null;
        }
        if (scriptNodeRef.current) {
          scriptNodeRef.current.disconnect();
          scriptNodeRef.current = null;
        }
        globalAudioPlayer.stop();

        if (shouldReconnectRef.current && retryCountRef.current < MAX_RETRIES && event.code !== 1000) {
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.log(`[WS] Reconectando em ${delay}ms (tentativa ${retryCountRef.current + 1}/${MAX_RETRIES})...`);
          retryCountRef.current++;
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              wsRef.current = null;
              // eslint-disable-next-line
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = (e) => {
        console.error("WS Error", e);
        isConnectingRef.current = false;
        setIsConnecting(false);
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [stopLiveDialog, persistResumptionHandle, persistSession]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistSession(isConnected);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isConnected, persistSession]);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component Unmounted");
        wsRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    globalAudioPlayer.stop();
    globalAudioPlayer.init();

    setMessages(prev => [...prev, { role: 'user', text }]);

    const clientContent = {
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text }],
        }],
        turnComplete: true,
      },
    };

    try {
      ws.send(JSON.stringify(clientContent));
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    resumptionHandleRef.current = null;
    sessionIdRef.current = `extrajus_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.removeItem(getSessionKey(documentIdRef.current));
    localStorage.removeItem('extrajus_chat_history');
  }, []);

  return {
    messages,
    sendMessage,
    isConnected,
    isConnecting,
    isRecording,
    stopLiveDialog,
    connect,
    error,
    clearHistory,
    isMuted,
    toggleMute,
    micError,
    audioLevel,
    sessionId: sessionIdRef.current,
  };
}
