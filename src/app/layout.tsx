import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "SmartDoc | Gerador de Petições Judiciais",
  description: "Gere petições iniciais completas e fundamentadas usando inteligência artificial jurídica. Ganhe produtividade no seu escritório de advocacia.",
  keywords: "petição judicial, petição inicial, gerador de petição, ia para advogados, inteligência artificial jurídica, smartdoc, software jurídico",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "SmartDoc | Gerador de Petições Judiciais",
    description: "Gere petições iniciais completas e fundamentadas usando inteligência artificial jurídica.",
    url: "https://extrajus.pro",
    siteName: "SmartDoc",
    locale: "pt_BR",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18263949464"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-18263949464');
          `}
        </Script>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
