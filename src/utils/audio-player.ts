// src/utils/audio-player.ts

export class AudioStreamPlayer {
  public audioContext: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private nextPlayTime: number = 0;
  private sampleRate: number = 24000; // Gemini Live Bidi padrão é 24kHz PCM16
  private activeSources: AudioBufferSourceNode[] = [];
  private initPromise: Promise<void> | null = null;
  private _volumeBuffer: Uint8Array<ArrayBuffer> | null = null; // Reused to avoid GC pressure on mobile

  public init() {
    if (!this.initPromise) {
      this.initPromise = this._init();
    }
    return this.initPromise;
  }

  private async _init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate
      });
      console.log("[Audio Player] AudioContext inicializado com 24kHz.");
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async ensureContext(): Promise<AudioContext> {
    await this.init();
    return this.audioContext!;
  }

  public getVolume(): number {
    if (!this.analyser) return 0;
    const bufferLength = this.analyser.frequencyBinCount;
    // Reuse buffer across calls — avoids GC pressure on mobile (called ~60x/sec via rAF)
    if (!this._volumeBuffer || this._volumeBuffer.length !== bufferLength) {
      this._volumeBuffer = new Uint8Array(new ArrayBuffer(bufferLength));
    }
    this.analyser.getByteTimeDomainData(this._volumeBuffer);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (this._volumeBuffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLength);
    return Math.min(1, rms * 5);
  }

  /**
   * Adiciona um chunk de áudio PCM16.
   * Removida a fila de promessas para reduzir latência, seguindo padrão do bot.
   */
  public async addPcm16Chunk(base64Pcm: string) {
    try {
      await this.ensureContext();
      const ctx = this.audioContext!;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      if (int16Array.length === 0) return;

      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      if (this.analyser) {
        source.connect(this.analyser);
      } else {
        source.connect(ctx.destination);
      }

      const now = ctx.currentTime;
      
      // Sincronização padrão bot: 350ms de lookahead inicial para evitar corte de áudio no warmup do hardware
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now + 0.35;
      }

      // Rastreamento para interrupção (stop)
      this.activeSources.push(source);
      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
      };

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      
    } catch (e) {
      console.error("[Audio Player] Erro ao processar chunk:", e);
    }
  }

  public stop() {
    // Interrupção real: pára todas as fontes agendadas
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextPlayTime = 0;
  }

  public async waitForPlaybackEnd() {
    if (!this.audioContext) return;
    
    const timeout = Date.now() + 15000; // 15s max timeout
    
    // First, wait until all scheduled audio has been queued to play
    while (this.nextPlayTime > this.audioContext.currentTime) {
      if (Date.now() > timeout) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Then wait an extra buffer (500ms) for any in-flight chunks still arriving
    await new Promise(resolve => setTimeout(resolve, 500));
    // Finally, wait until all active source nodes have actually finished
    while (this.activeSources.length > 0) {
      if (Date.now() > timeout) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export const globalAudioPlayer = new AudioStreamPlayer();
