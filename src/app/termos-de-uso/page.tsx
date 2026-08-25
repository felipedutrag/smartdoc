"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, ShieldCheck, FileText, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TermosDeUsoPage() {
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
              LEGAL
            </Badge>
          </Link>
        </div>

        {/* Título */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <FileText className="size-3.5" />
            <span>Condições Gerais de Contratação</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Termos de Uso
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: Agosto de 2026 &bull; Vigência imediata
          </p>
        </div>

        {/* Conteúdo Legal */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground border-t border-border/60 pt-6">
          
          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">1</span>
              Objeto e Natureza da Plataforma
            </h2>
            <p>
              O <strong>SmartDoc</strong> é uma plataforma SaaS (Software as a Service) de inteligência artificial forense voltada à assistência, organização, sugestão de teses doutrinárias e redação acelerada de minutas de peças processuais e documentos jurídicos.
            </p>
            <p>
              Ao criar uma conta ou utilizar os serviços do SmartDoc, você (doravante denominado <strong>"Usuário"</strong>) declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com nossa Política de Privacidade.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">2</span>
              Responsabilidade Técnica e Exercício da Advocacia
            </h2>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-foreground">
              <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-wider">
                <ShieldCheck className="size-4" />
                <span>Autonomia Profissional e Revisão Obrigatória</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O SmartDoc é uma ferramenta de apoio computacional e <strong>não substitui o julgamento profissional, a capacidade postulatória e a responsabilidade técnica do advogado</strong> devidamente inscrito nos quadros da Ordem dos Advogados do Brasil (OAB) ou do operador do direito responsável.
              </p>
            </div>
            <p>
              O Usuário é o único e exclusivo responsável pela conferência fática, jurídica, temporal e probatória de qualquer documento gerado antes de seu protocolo, assinatura ou compartilhamento perante qualquer juízo, tribunal ou órgão arbitral.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">3</span>
              Cadastro, Acesso e Segurança da Conta
            </h2>
            <p>
              Para utilizar os recursos do SmartDoc, o Usuário realiza seu cadastro fornecendo informações verídicas e atualizadas. As credenciais de acesso (e-mail e senha) são de uso pessoal e intransferível, cabendo exclusivamente ao Usuário a guarda e sigilo de sua senha.
            </p>
            <p>
              O SmartDoc reserva-se o direito de recusar cadastros ou suspender contas que violem dispositivos legais, tentem violar os sistemas de segurança da plataforma ou façam uso abusivo e automatizado das APIs sem autorização.
            </p>
          </section>

          {/* Seção 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">4</span>
              Pacotes de Créditos, Pagamento e Sem Expiração
            </h2>
            <p>
              A utilização do serviço é estruturada em pacotes de créditos pré-pagos sob demanda (Pay-as-you-go). Cada geração de petição completa consome 1 (um) crédito do saldo da conta.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground font-medium">
              <li><strong>Cumulativos e Sem Expiração:</strong> Os créditos adquiridos pelo Usuário não expiram e permanecem disponíveis em seu saldo por prazo indeterminado.</li>
              <li><strong>Liberação Imediata:</strong> Pagamentos processados via Pix são confirmados e creditados automaticamente no saldo da conta.</li>
              <li><strong>Não Reembolsabilidade de Créditos Consumidos:</strong> Créditos efetivamente utilizados na geração e processamento de documentos com inteligência artificial não são passíveis de estorno após o consumo do processamento.</li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">5</span>
              Propriedade Intelectual e Titularidade das Peças
            </h2>
            <p>
              O Usuário detém a <strong>titularidade integral e irrestrita</strong> de todos os documentos, teses, petições e conteúdos finais gerados, exportados ou editados por meio de sua conta no SmartDoc.
            </p>
            <p>
              O código-fonte, marcas, interfaces, layout, arquitetura dos modelos e logotipos do SmartDoc são de propriedade exclusiva da plataforma, protegidos pelas leis de propriedade intelectual e direitos autorais.
            </p>
          </section>

          {/* Seção 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">6</span>
              Disponibilidade do Serviço e Suporte
            </h2>
            <p>
              Empreendemos os melhores esforços técnicos para assegurar a alta disponibilidade e estabilidade ininterrupta da plataforma. Eventuais manutenções preventivas ou indisponibilidades temporárias de serviços de terceiros (como provedores de nuvem ou modelos generativos) serão solucionadas com a máxima presteza técnica.
            </p>
          </section>

          {/* Seção 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">7</span>
              Foro e Legislação Aplicável
            </h2>
            <p>
              Os presentes Termos de Uso são regidos e interpretados em conformidade com a legislação da República Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº 12.965/14) e o Código de Defesa do Consumidor. Fica eleito o foro do domicílio do Usuário para dirimir quaisquer dúvidas decorrentes deste contrato.
            </p>
          </section>
        </div>

        {/* Rodapé Interno */}
        <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SmartDoc IA &bull; Todos os direitos reservados.</div>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidade" className="text-primary hover:underline">
              Política de Privacidade
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
