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
        <linearGradient id="sd-grad-primary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="sd-grad-light" x1="16" y1="4" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="sd-grad-dark" x1="4" y1="16" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
      </defs>

      {/* Bloco Superior (Prisma Angular Esquerdo) */}
      <path
        d="M6 7C6 5.34315 7.34315 4 9 4H21C22.6569 4 24 5.34315 24 7V11C24 12.6569 22.6569 14 21 14H13C10.7909 14 9 15.7909 9 18V18"
        stroke="url(#sd-grad-primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bloco Inferior (Prisma Angular Direito) */}
      <path
        d="M23 14V14C23 16.2091 21.2091 18 19 18H11C9.34315 18 8 19.3431 8 21V25C8 26.6569 9.34315 28 11 28H23C24.6569 28 26 26.6569 26 25V21"
        stroke="url(#sd-grad-primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vértice Superior em Corte Chanfrado / Folio Corner */}
      <path
        d="M20 4L26 10H20V4Z"
        fill="url(#sd-grad-light)"
      />

      {/* Spark Central de Inteligência */}
      <circle
        cx="16"
        cy="16"
        r="1.8"
        fill="#ffffff"
        className="dark:fill-white fill-primary"
      />
    </svg>
  );
}

// Variação 2: Monograma Isométrico Linear (Estilo Raycast / Linear App)
export function SmartDocMonogram({ className = "size-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="sd-mono-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      
      {/* Geometria Isométrica 3D Fita Contínua */}
      <path
        d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
        stroke="url(#sd-mono-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M16 3L27 9.5L16 16L5 9.5L16 3Z"
        fill="url(#sd-mono-grad)"
        fillOpacity="0.15"
      />
      <path
        d="M10 12.5L16 16L22 12.5M16 16V25"
        stroke="url(#sd-mono-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 17.5L16 21L22 17.5"
        stroke="url(#sd-mono-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
