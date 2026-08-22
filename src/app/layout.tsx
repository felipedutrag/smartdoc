import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SmartDoc | Notificação Extrajudicial com Validade Jurídica",
  description: "Gere notificações extrajudiciais completas e fundamentadas usando inteligência artificial jurídica. Faça cobranças, encerre contratos e exija seus direitos em segundos.",
  keywords: "notificação extrajudicial, cobrança extrajudicial, gerador de notificação extrajudicial, advogado online, carta extrajudicial, modelo de notificação extrajudicial, notificação de cobrança, smartdoc",
  openGraph: {
    title: "SmartDoc | Notificação Extrajudicial",
    description: "Gere notificações extrajudiciais completas e fundamentadas usando inteligência artificial jurídica.",
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
    <html lang="pt-BR" className={sans.variable} suppressHydrationWarning>
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
        {children}
      </body>
    </html>
  );
}
