"use client";

import React from "react";

interface DiscountBannerProps {
  discountActive: boolean;
  discountTimeLeft: number;
  isPaid: boolean;
  isMobile: boolean;
}

export function DiscountBanner({
  discountActive,
  discountTimeLeft,
  isPaid,
  isMobile,
}: DiscountBannerProps) {
  if (!discountActive || discountTimeLeft <= 0 || isPaid) return null;

  return (
    <div style={{
      position: "fixed",
      top: "85px", // Posicionado abaixo da toolbar
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 150,
      width: "max-content",
      maxWidth: "calc(100% - 32px)",
      background: "rgba(220, 38, 38, 0.98)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(12px)",
      padding: isMobile ? "8px 16px" : "10px 24px",
      borderRadius: "99px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? "8px" : "12px",
      boxShadow: "0 10px 30px rgba(220, 38, 38, 0.4)",
      animation: "pulseBtn 2s infinite",
      boxSizing: "border-box"
    }}>
      <span style={{ 
        color: "white", 
        fontWeight: 800, 
        fontSize: isMobile ? "11px" : "14px", 
        letterSpacing: "0.05em", 
        textTransform: "uppercase",
        whiteSpace: "nowrap"
      }}>
        Oferta Exclusiva Expira Em
      </span>
      <div style={{
        background: "rgba(255, 255, 255, 0.2)",
        color: "white",
        padding: isMobile ? "2px 8px" : "4px 12px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontWeight: 800,
        fontSize: isMobile ? "16px" : "18px",
        letterSpacing: "2px"
      }}>
        {String(Math.floor(discountTimeLeft / 60)).padStart(2, '0')}:
        {String(discountTimeLeft % 60).padStart(2, '0')}
      </div>
    </div>
  );
}
