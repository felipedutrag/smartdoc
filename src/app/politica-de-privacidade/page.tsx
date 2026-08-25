"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Shield, Lock, EyeOff, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="min-h-screen bg-background text-foreground relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header / Navegação */}
        <div className="flex items-center justify-between border-b border-border/70 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Voltar para o Início</span>
          </Link>

          <Link href="/" className="group flex items-center gap-2 no-underline">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary">
              <Scale className="size-4" />
            </div>
            <div className="flex items-center text-sm font-bold tracking-tight text-foreground">
              <span>SMART</span>
              <span className="text-primary font-black ml-0.5">DOC</span>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono font-bold">
              LGPD
            </Badge>
          </Link>
        </div>

        {/* Título */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Shield className="size-3.5" />
            <span>Privacidade & Proteção de Dados (LGPD)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: Agosto de 2026 &bull; Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/18)
          </p>
        </div>

        {/* Conteúdo Legal */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground border-t border-border/60 pt-6">
          
          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">1</span>
              Compromisso com a Privacidade e Sigilo Forense
            </h2>
            <p>
              O <strong>SmartDoc</strong> reconhece a sensibilidade e o caráter sigiloso inerente à prática da advocacia e ao relacionamento cliente-advogado. Esta Política de Privacidade descreve de maneira transparente como coletamos, utilizamos, armazenamos e protegemos os seus dados e os conteúdos processados em nossa plataforma.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">2</span>
              Dados Coletados e Finalidade do Tratamento
            </h2>
            <p>Coletamos apenas os dados estritamente necessários para a prestação e aprimoramento dos serviços:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-border bg-card/60 p-4 space-y-1.5">
                <div className="font-bold text-foreground text-xs flex items-center gap-2">
                  <Lock className="size-3.5 text-primary" />
                  <span>Dados Cadastrais do Usuário</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nome e e-mail utilizados para autenticação, controle de saldo de créditos e comunicações transacionais essenciais.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 space-y-1.5">
                <div className="font-bold text-foreground text-xs flex items-center gap-2">
                  <EyeOff className="size-3.5 text-primary" />
                  <span>Relato Fático e Conteúdo Processual</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fatos e diretrizes inseridos para geração da minuta de petição, processados exclusivamente para entregar o documento solicitado.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">3</span>
              Não Utilização de Dados para Treinamento Público de Modelos
            </h2>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-foreground">
              <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-wider">
                <CheckCircle2 className="size-4" />
                <span>Garantia de Não Retenção de Modelos</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Os dados, fatos e peças processuais redigidas pelos advogados <strong>NÃO são utilizados para treinar modelos públicos de IA</strong> nem compartilhados com terceiros para fins de mineração ou publicidade. As requisições de inferência ocorrem por canais corporativos com cláusula de zero-retention.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">4</span>
              Segurança e Criptografia da Informação
            </h2>
            <p>
              Adotamos medidas técnicas e organizacionais de padrão bancário para proteger as informações contra acessos não autorizados, vazamentos, destruição ou alteração indevida:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-foreground font-medium">
              <li>Criptografia em trânsito com protocolo TLS 1.3 / HTTPS com chave AES-256.</li>
              <li>Isolamento de banco de dados com Row Level Security (RLS) no Supabase (cada usuário acessa apenas seus próprios documentos).</li>
              <li>Credenciais de acesso criptografadas com algoritmos de hash irreversíveis (Bcrypt/Argon2).</li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">5</span>
              Direitos do Titular de Dados (Art. 18 da LGPD)
            </h2>
            <p>
              Em conformidade com a LGPD, o Usuário possui a qualquer tempo o direito de solicitar a confirmação da existência de tratamento, o acesso aos dados, a retificação de dados incompletos ou a <strong>eliminação definitiva</strong> de sua conta e de todos os documentos e petições armazenados em seu histórico.
            </p>
          </section>

          {/* Seção 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">6</span>
              Contato do Encarregado de Proteção de Dados (DPO)
            </h2>
            <p>
              Para exercer seus direitos de titular ou esclarecer qualquer dúvida sobre o tratamento de dados pessoais, entre em contato diretamente pelo e-mail:
            </p>
            <p className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 p-2.5 rounded-lg inline-block font-bold">
              contato@smartdoc.work
            </p>
          </section>
        </div>

        {/* Rodapé Interno */}
        <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SmartDoc IA &bull; Todos os direitos reservados.</div>
          <div className="flex items-center gap-4">
            <Link href="/termos-de-uso" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
