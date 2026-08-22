"use client";

import React, { useState } from "react";
import { Mic, Send } from "lucide-react";

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

  if (isGenerating || isPaid) return null;

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
        ? "0 10px 30px rgba(217, 119, 6, 0.12)" 
        : "0 8px 32px rgba(0, 0, 0, 0.12)",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {/* Static gradient border background (visible when not focused) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(217, 119, 6, 0.35) 0%, rgba(251, 191, 36, 0.15) 100%)",
        zIndex: 0,
        opacity: showAccelerator ? 1 : 0,
        transition: "opacity 0.3s ease",
      }} />

      {/* Static border background (visible when focused) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
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
        background: "var(--surface)",
        padding: "8px 12px",
        borderRadius: "23px",
        backdropFilter: "blur(10px)",
        position: "relative",
        zIndex: 1,
        border: "none"
      }}>
        <input
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
          placeholder={isRewriting ? "A IA está editando o documento..." : "Peça uma alteração para a IA..."}
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
