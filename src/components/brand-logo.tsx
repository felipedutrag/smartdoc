import React from "react";

export function SmartDocLogo({ className = "size-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Gradiente Ouro Líquido & Âmbar Imperial (Face Sombra) */}
        <linearGradient id="sd-pen-gold-left" x1="6" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        {/* Gradiente Ouro Polido (Face Luz) */}
        <linearGradient id="sd-pen-gold-right" x1="26" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Lâmina Esquerda da Pena (Tine Esquerdo) */}
      <path
        d="M16 2.5C14.8 6.8 7.5 12.5 7.5 18C7.5 22.8 10 28 10.5 30H16V2.5Z"
        fill="url(#sd-pen-gold-left)"
      />

      {/* Lâmina Direita da Pena (Tine Direito com Reflexo de Luz) */}
      <path
        d="M16 2.5C17.2 6.8 24.5 12.5 24.5 18C24.5 22.8 22 28 21.5 30H16V2.5Z"
        fill="url(#sd-pen-gold-right)"
      />

      {/* Gravura / Filigrana Clássica de Caneta Tinteiro */}
      <path
        d="M11 25.5C11 20 13.5 16 16 16C18.5 16 21 20 21 25.5"
        stroke="#78350f"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Fenda Central de Tinta (Slit) */}
      <path
        d="M16 2.5V15.5"
        stroke="#18181b"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Furo de Respiro Central da Caneta Tinteiro (Breather Hole) */}
      <circle
        cx="16"
        cy="16"
        r="1.8"
        fill="#18181b"
      />

      {/* Ponta de Irídio / Luz de Alta Definição */}
      <path
        d="M15 2.5H17L16 1.2L15 2.5Z"
        fill="#ffffff"
      />
    </svg>
  );
}

// Variação Caneta Tinteiro Inclinada a 45 Graus (Em Posição de Redação)
export function SmartDocPenWriting({ className = "size-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g transform="rotate(45 16 16)">
        <SmartDocLogo />
      </g>
    </svg>
  );
}
