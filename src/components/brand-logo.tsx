import React from "react";
import { Scale } from "lucide-react";

export function SmartDocLogo({ className = "size-4", ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Scale className={className} {...(props as any)} />
  );
}

// Componente Unificado de Marca restaurado exatamente conforme o padrão oficial do Loader
interface SmartDocBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  badge?: string;
  className?: string;
  showIcon?: boolean;
}

export function SmartDocBrand({ size = "md", badge, className = "", showIcon = true }: SmartDocBrandProps) {
  const iconSize = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : size === "xl" ? "size-5.5" : "size-4";
  const boxSize = size === "sm" ? "size-6" : size === "lg" ? "size-8" : size === "xl" ? "size-11" : "size-7";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base sm:text-lg" : size === "xl" ? "text-2xl sm:text-3xl" : "text-sm";
  const badgeSize = size === "sm" ? "text-[8px] px-1.5 py-0.2" : size === "xl" ? "text-[10px] px-2.5 py-0.5" : "text-[9px] px-1.5 py-0.5";

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 select-none ${className}`}>
      {showIcon && (
        <div className={`flex ${boxSize} shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-sm shadow-primary/10`}>
          <Scale className={iconSize} />
        </div>
      )}
      <div className={`flex items-center ${textSize} font-extrabold tracking-tight text-foreground leading-none`}>
        <span>SMART</span>
        <span className="text-primary font-black ml-1">DOC</span>
        {badge && (
          <span className={`ml-2 rounded-full border border-primary/30 bg-primary/10 font-mono font-bold text-primary uppercase tracking-widest ${badgeSize}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
