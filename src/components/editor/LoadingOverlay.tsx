"use client";

import React from "react";

interface LoadingOverlayProps {
  mounted: boolean;
  isGenerating: boolean;
  streamStarted: boolean;
}

export function LoadingOverlay({
  mounted,
  isGenerating,
  streamStarted,
}: LoadingOverlayProps) {
  if (mounted && (!isGenerating || streamStarted)) return null;

  return (
    <div style={{ 
      position: "fixed",
      inset: 0,
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 2000,
      background: "rgba(10, 10, 10, 0.45)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      gap: "24px",
      padding: "40px"
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px"
      }}>
        {/* Logo */}
        <span
          style={{
            fontSize: 32,
            display: "flex",
            alignItems: "center",
            cursor: "default",
            position: "relative",
            animation: "pulseLogo 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          }}
        >
          <span style={{ fontWeight: 500, letterSpacing: "-0.05em", color: "white" }}>SMART</span>
          <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.05em", marginLeft: 4 }}>DOC</span>
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -12,
              fontSize: 12,
              fontWeight: 800,
              color: "#d97706",
              opacity: 0.8
            }}
          >
            IA
          </span>
        </span>
        
        {/* Progress Bar */}
        <div style={{
          width: "240px",
          height: "4px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "40%",
            background: "linear-gradient(90deg, transparent, #d97706, #fbbf24, #d97706, transparent)",
            borderRadius: "4px",
            animation: "progressIndeterminate 1.5s ease-in-out infinite",
            boxShadow: "0 0 10px rgba(217, 119, 6, 0.5)"
          }} />
        </div>
        <style>{`
          @keyframes progressIndeterminate {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(250%); }
          }
          @keyframes pulseLogo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.98); }
          }
        `}</style>
      </div>
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <h3 style={{ 
          color: "white", 
          fontSize: "20px", 
          fontWeight: 800, 
          letterSpacing: "-0.02em",
          marginBottom: "10px"
        }}>
          Preparando sua notificação...
        </h3>
        <p style={{
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: "12px",
          lineHeight: "1.6",
          fontWeight: 500,
          margin: 0
        }}>
          Sua notificação está sendo redigida para resolver essa situação e garantir a solução definitiva que você precisa.
        </p>
      </div>
    </div>
  );
}
