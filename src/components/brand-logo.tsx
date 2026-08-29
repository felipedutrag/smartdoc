import React from "react";

export type LogoVariant = "quill" | "prism" | "infinity" | "seal";

interface SmartDocLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: LogoVariant;
}

export function SmartDocLogo({ className = "size-5", variant = "quill", ...props }: SmartDocLogoProps) {
  // ── OPÇÃO 1: A PENA FORENSE GEOMÉTRICA (The Tech Quill) ──
  // Silhueta minimalista de pena de assinatura executiva com corte em fenda de precisão
  if (variant === "quill") {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
          <linearGradient id="sd-quill-left" x1="4" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="sd-quill-right" x1="16" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        {/* Lâmina Esquerda */}
        <path
          d="M16 2.5C16 2.5 7.5 9.5 7.5 18C7.5 22.6944 11.3056 26.5 16 29.5V2.5Z"
          fill="url(#sd-quill-left)"
        />
        {/* Lâmina Direita */}
        <path
          d="M16 2.5C16 2.5 24.5 9.5 24.5 18C24.5 22.6944 20.6944 26.5 16 29.5V2.5Z"
          fill="url(#sd-quill-right)"
          opacity="0.9"
        />
        {/* Fenda Central de Tinteiro */}
        <path
          d="M16 9V23"
          stroke="#09090b"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Vértice Circular de Respiro */}
        <circle cx="16" cy="23" r="1.8" fill="#09090b" />
      </svg>
    );
  }

  // ── OPÇÃO 2: O PRISMA HEXAGONAL 3D (The Hexa-Folio) ──
  if (variant === "prism") {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
          <linearGradient id="sd-prism-top" x1="6" y1="4" x2="26" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="sd-prism-left" x1="6" y1="14" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="sd-prism-right" x1="16" y1="14" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        <path d="M16 4L26 9.5L16 15L6 9.5L16 4Z" fill="url(#sd-prism-top)" />
        <path d="M6 9.5L16 15V27L6 21.5V9.5Z" fill="url(#sd-prism-left)" />
        <path d="M26 9.5L16 15V27L26 21.5V9.5Z" fill="url(#sd-prism-right)" />
        <path d="M16 4L26 9.5V21.5L16 27L6 21.5V9.5L16 4Z" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.4" />
      </svg>
    );
  }

  // ── OPÇÃO 3: O MONOGRAMA INFINITO 'S' (The Infinite Curve) ──
  if (variant === "infinity") {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
          <linearGradient id="sd-inf-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path
          d="M22 8C22 5.79086 20.2091 4 18 4H13C9.68629 4 7 6.68629 7 10C7 13.3137 9.68629 16 13 16H19C22.3137 16 25 18.6863 25 22C25 25.3137 22.3137 28 19 28H14C11.7909 28 10 26.2091 10 24"
          stroke="url(#sd-inf-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="8" r="1.5" fill="#fdba74" />
        <circle cx="10" cy="24" r="1.5" fill="#ea580c" />
      </svg>
    );
  }

  // ── OPÇÃO 4: O BRASÃO DIAMANTE (The Diamond Seal) ──
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <defs>
        <linearGradient id="sd-seal-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect
        x="16"
        y="2"
        width="19.8"
        height="19.8"
        rx="4"
        transform="rotate(45 16 2)"
        stroke="url(#sd-seal-grad)"
        strokeWidth="2.5"
        fill="url(#sd-seal-grad)"
        fillOpacity="0.12"
      />
      <path
        d="M13 11H18C19.1046 11 20 11.8954 20 13C20 14.1046 19.1046 15 18 15H14C12.8954 15 12 15.8954 12 17C12 18.1046 12.8954 19 14 19H19"
        stroke="url(#sd-seal-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
