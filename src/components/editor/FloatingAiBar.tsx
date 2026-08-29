"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Send, Sparkles, Command } from "lucide-react";

interface FloatingAiBarProps {
  isGenerating: boolean;
  isPaid: boolean;
  isRewriting: boolean;
  textInput: string;
  setTextInput: (val: string) => void;
  onSend: (text: string) => void;
  isDictating: boolean;
  toggleDictation: () => void;
  hasActiveEdit?: boolean;
}

export function FloatingAiBar({
  isGenerating,
  isPaid,
  isRewriting,
  textInput,
  setTextInput,
  onSend,
  isDictating,
  toggleDictation,
  hasActiveEdit = false,
}: FloatingAiBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  if (isGenerating) return null;

  const showAccelerator = !isFocused;

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      width: "calc(100% - 32px)",
      maxWidth: "600px",
      padding: "1px",
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: isFocused 
        ? "0 10px 30px color-mix(in srgb, var(--primary) 20%, transparent)" 
        : "0 8px 32px rgba(0, 0, 0, 0.12)",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {/* Static gradient border background (visible when not focused) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 35%, transparent) 0%, color-mix(in srgb, var(--primary) 15%, transparent) 100%)",
        zIndex: 0,
        opacity: showAccelerator ? 1 : 0,
        transition: "opacity 0.3s ease",
      }} />

      {/* Static border background (visible when focused) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, white) 100%)",
        zIndex: 0,
        opacity: isFocused ? 1 : 0,
        transition: "opacity 0.3s ease",
      }} />

      {/* Inner Content Container */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%",
        background: "var(--card)",
        padding: "8px 12px",
        borderRadius: "23px",
        backdropFilter: "blur(10px)",
        position: "relative",
        zIndex: 1,
        border: "none"
      }}>
        <input
          ref={inputRef}
          type="text"
          value={textInput}
          disabled={isRewriting}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setTextInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && textInput.trim() && !isRewriting) {
              onSend(textInput);
            }
          }}
          placeholder={isRewriting ? "A IA está editando o documento..." : "Peça uma alteração para a IA (ou pressione Ctrl+K)..."}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: isRewriting ? "var(--text-muted)" : "var(--text-primary)",
            fontSize: "14px",
            padding: "0 8px",
            cursor: isRewriting ? "not-allowed" : "text",
            fontFamily: "inherit"
          }}
        />
        {!isFocused && !textInput && (
          <kbd
            onClick={() => inputRef.current?.focus()}
            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/80 rounded cursor-pointer hover:bg-muted transition-colors select-none mr-1"
            title="Atalho de teclado"
          >
            <span>Ctrl</span><span>K</span>
          </kbd>
        )}
        <button
          onClick={() => {
            toggleDictation();
          }}
          disabled={isRewriting}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isDictating ? "rgba(239, 68, 68, 0.15)" : "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isRewriting ? "not-allowed" : "pointer",
            color: isDictating ? "#ef4444" : "var(--text-muted)",
            transition: "all 0.2s ease",
            flexShrink: 0,
            marginRight: "4px"
          }}
          title={isDictating ? "Parar gravação" : "Ditar por voz (Local)"}
        >
          <Mic size={16} className={isDictating ? "animate-pulse" : ""} />
        </button>
        <button
          onClick={() => {
            if (textInput.trim() && !isRewriting) {
              onSend(textInput);
            }
          }}
          disabled={isRewriting}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isRewriting ? "var(--surface-elevated)" : "var(--text-primary)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isRewriting ? "not-allowed" : "pointer",
            color: "var(--bg)",
            transition: "all 0.2s ease",
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (!isRewriting) e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            if (!isRewriting) e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          {isRewriting ? (
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid var(--text-muted)",
              borderLeftColor: "var(--text-primary)",
              borderRadius: "50%",
              animation: "spin-rewrite 1s linear infinite"
            }} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
