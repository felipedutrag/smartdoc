import React from "react";

export function Footer() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .global-footer {
          padding: 24px 20px 16px !important;
        }
        @media (max-width: 768px) {
          .global-footer {
            padding: 48px 20px 16px !important;
          }
        }
      `}} />
      <footer
        className="animate-fade-in-up global-footer"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderTop: "1px solid var(--border, rgba(128, 128, 128, 0.15))",
          width: "100%",
          zIndex: 10,
          boxSizing: "border-box",
          marginTop: "10px"
        }}
      >
      <span
        style={{
          fontSize: 17,
          fontFamily: "var(--font-sans), sans-serif",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 0,
          cursor: "default",
          textTransform: "none",
          position: "relative"
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: "-0.04em" }}>smart</span>
        <span style={{ fontWeight: 900, color: "#d97706" }}>.</span>
        <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.05em", marginLeft: 0 }}>doc</span>
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -22,
            background: "rgba(217, 119, 6, 0.12)",
            border: "1px solid rgba(217, 119, 6, 0.25)",
            color: "#d97706",
            fontSize: 8,
            fontWeight: 900,
            padding: "1px 5px",
            borderRadius: "3px",
            textTransform: "uppercase",
            opacity: 1
          }}>
          IA
        </span>
      </span>
    </footer>
    </>
  );
}
