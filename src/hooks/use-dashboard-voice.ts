'use client'

import { useGeminiLive } from '@/hooks/use-gemini-live'

export interface DashboardVoiceOptions {
  onToolCall?: (name: string, args: any) => void;
  onEditDocument?: (instruction: string) => void;
  onFormatText?: (action: string, targetText: string) => void;
  setupEndpoint?: string;
  extraContext?: string;
  documentId?: string | null;
}

export function useDashboardVoice(options?: DashboardVoiceOptions) {
  const handleToolCall = (name: string, args: any) => {
    if (name === 'edit_document' && args?.instruction) {
      if (options?.onEditDocument) {
        options.onEditDocument(args.instruction);
      }
    }
    if (name === 'format_text' && args?.target_text && args?.action) {
      if ((options as any)?.onFormatText) {
        (options as any).onFormatText(args.action, args.target_text);
      }
    }
    if (options?.onToolCall) {
      options.onToolCall(name, args);
    }
  };

  const geminiLive = useGeminiLive(
    undefined,
    options?.setupEndpoint || '/api/config/gemini-editor-setup',
    handleToolCall,
    options?.extraContext,
    options?.documentId
  );

  return {
    ...geminiLive,
    isVoiceActive: geminiLive.isConnected,
    startVoice: geminiLive.connect,
    stopVoice: geminiLive.stopLiveDialog,
    toggleVoice: () => {
      if (geminiLive.isConnected) {
        geminiLive.stopLiveDialog();
      } else {
        geminiLive.connect();
      }
    }
  };
}

