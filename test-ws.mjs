import WebSocket from 'ws';

const apiKey = process.env.GEMINI_API_KEY || '';
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    setup: {
      model: "models/gemini-3.1-flash-live-preview",
      systemInstruction: { parts: [{text: "You are an assistant."}] },
      generationConfig: {
        responseModalities: ["TEXT"]
      },
      inputAudioTranscription: {}
    }
  }));
});

ws.on('message', (data) => {
  console.log('Message:', data.toString());
});

ws.on('close', (code, reason) => {
  console.log('Closed:', code, reason.toString());
});

ws.on('error', (err) => {
  console.error('Error:', err);
});

