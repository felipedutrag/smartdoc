"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Lock, ShieldCheck } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentStep: 1 | 2 | 3;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  customerPhone: string;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  upsellLawyer: boolean;
  setUpsellLawyer: (val: boolean) => void;
  upsellWhatsapp: boolean;
  setUpsellWhatsapp: (val: boolean) => void;
  price: number;
  discountActive: boolean;
  isRewriting: boolean;
  handleGeneratePix: () => void;
  isMobile: boolean;
  isDev: boolean;
  isLoadingPix: boolean;
  pixData: { pixCode: string; externalId: string } | null;
  handleCopyPix: () => void;
  simulatePaymentSuccess: () => void;
  inline?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentStep,
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  handlePhoneChange,
  upsellLawyer,
  setUpsellLawyer,
  upsellWhatsapp,
  setUpsellWhatsapp,
  price,
  discountActive,
  isRewriting,
  handleGeneratePix,
  isMobile,
  isDev,
  isLoadingPix,
  pixData,
  handleCopyPix,
  simulatePaymentSuccess,
  inline = false,
}: PaymentModalProps) {
  const [pixTimeLeft, setPixTimeLeft] = React.useState(15 * 60);

  React.useEffect(() => {
    if (paymentStep === 2 && pixData && pixTimeLeft > 0) {
      const interval = setInterval(() => {
        setPixTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStep, pixData, pixTimeLeft]);

  const formatPixTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  const isActualModal = !inline || paymentStep === 2 || paymentStep === 3;

  const renderContent = () => (
    <div style={{
      background: isActualModal ? "var(--surface)" : "transparent",
      padding: isActualModal ? (isMobile ? "16px" : "36px 32px") : "0",
      borderRadius: isActualModal ? "24px" : "0",
      maxWidth: isActualModal ? "480px" : "100%",
      width: "100%",
      textAlign: "center",
      position: "relative"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .checkout-input {
          padding: ${isMobile ? "12px 16px" : "14px 18px"};
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--bg);
          color: var(--text-primary);
          width: 100%;
          font-size: 14px;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }
        .checkout-input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.08);
          background: var(--surface-elevated);
        }
        .order-bump-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          padding: ${isMobile ? "14px" : "18px 20px"};
          border: 1.5px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
          box-sizing: border-box;
        }
        .order-bump-card:hover {
          border-color: rgba(217, 119, 6, 0.3);
          background: rgba(217, 119, 6, 0.015);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.02);
        }
        .order-bump-card.active {
          border-color: rgba(217, 119, 6, 0.5);
          background: rgba(217, 119, 6, 0.04);
          box-shadow: 0 4px 16px rgba(217, 119, 6, 0.05);
        }
        .order-bump-badge {
          font-size: 9px;
          background: #d97706;
          color: white;
          padding: 2px 8px;
          border-radius: 50px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 2.5px solid #d97706;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .custom-checkbox.checked {
          background: #d97706;
          border-color: #d97706;
          color: white;
        }
      `}} />
      {isDev && isActualModal && paymentStep !== 2 && paymentStep !== 3 && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            padding: "5px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 100,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          }}
        >
          Voltar ao Editor (Dev)
        </button>
      )}

        {paymentStep === 1 && (
          <>
            {inline ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px", textAlign: "left" }}>
                <div>
                  <h4 style={{
                    margin: "0 0 4px",
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}>
                    {discountActive ? "Oferta Exclusiva" : "Petição Concluída"}
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}>
                    {discountActive
                      ? "Aproveite o desconto especial antes que expire."
                      : "Libere, edite e faça o download de sua petição."}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                  {discountActive && (
                    <span style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      textDecoration: "line-through",
                      marginBottom: "1px",
                    }}>R$ 39,00</span>
                  )}
                  <span style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: discountActive ? "#ef4444" : "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}>
                    R$ {(price).toFixed(2).replace(".", ",")}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>pagamento único</span>
                </div>
              </div>
            ) : (
              <>
                {/* Header Lock Icon */}
                <div style={{
                  width: isMobile ? "44px" : "56px",
                  height: isMobile ? "44px" : "56px",
                  borderRadius: "50%",
                  background: "rgba(217, 119, 6, 0.1)",
                  border: "1px solid rgba(217, 119, 6, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: isMobile ? "0 auto 10px" : "0 auto 16px",
                  boxShadow: "0 0 20px rgba(217, 119, 6, 0.1)"
                }}>
                  <Lock size={isMobile ? 18 : 24} color="#f59f0b" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "center", marginBottom: isMobile ? "12px" : "20px" }}>
                  <h3 style={{
                    fontSize: isMobile ? "18px" : "22px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: "-0.02em"
                  }}>
                    Desbloquear Petição Inicial
                  </h3>
                  <p style={{
                    fontSize: isMobile ? "12px" : "14px",
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: "1.5"
                  }}>
                    Conclua seus dados abaixo para ativar o editor completo, baixar a versão finalizada e garantir seus direitos com máxima segurança.
                  </p>
                </div>
              </>
            )}

            {inline && <div style={{ height: "1px", background: "var(--border)", margin: "14px 0 20px" }} />}

            {/* Form Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "12px", width: "100%" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "8px" : "12px",
                width: "100%"
              }}>
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="checkout-input"
                />
                <input 
                  type="email" 
                  required
                  placeholder="E-mail Principal" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="checkout-input"
                />
              </div>


              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => {
                    if (!customerName.trim()) {
                      alert("Por favor, insira o seu nome.");
                      return;
                    }
                    if (!customerEmail.trim() || !customerEmail.includes("@")) {
                      alert("Por favor, insira um e-mail válido.");
                      return;
                    }
                    handleGeneratePix();
                  }}
                  style={{
                    background: discountActive
                      ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: isMobile ? "14px 24px" : "16px 36px",
                    borderRadius: "12px",
                    fontSize: isMobile ? "14px" : "15px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    cursor: "pointer",
                    boxShadow: discountActive
                      ? "0 4px 12px rgba(239, 68, 68, 0.2)"
                      : "0 4px 12px rgba(217, 119, 6, 0.2)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.filter = "brightness(1.08)";
                    e.currentTarget.style.boxShadow = discountActive
                      ? "0 6px 16px rgba(239, 68, 68, 0.3)"
                      : "0 6px 16px rgba(217, 119, 6, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.filter = "brightness(1)";
                    e.currentTarget.style.boxShadow = discountActive
                      ? "0 4px 12px rgba(239, 68, 68, 0.2)"
                      : "0 4px 12px rgba(217, 119, 6, 0.2)";
                  }}
                >
                  {inline ? "Desbloquear Petição" : `Ir para o Pagamento (R$ ${(price).toFixed(2).replace('.', ',')})`}
                </button>
                {discountActive && (
                  <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 700, animation: "pulseBtn 2s infinite" }}>
                    🔥 Oferta Especial: Economize R$ 10,00 por tempo limitado!
                  </span>
                )}
                
                {isDev && !inline && (
                  <button 
                    onClick={onClose}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      padding: isMobile ? "8px 16px" : "10px 20px",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: isMobile ? "12px" : "13px",
                      cursor: "pointer",
                      width: "100%",
                      transition: "background 0.2s"
                    }}
                  >
                    Voltar ao Editor (Dev)
                  </button>
                )}

                {!inline && (
                  <button
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja descartar esta petição? Todos os dados serão perdidos.")) {
                        localStorage.clear();
                        window.location.href = "/";
                      }
                    }}
                    style={{
                      background: "transparent",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      padding: isMobile ? "8px 16px" : "10px 20px",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: isMobile ? "12px" : "13px",
                      cursor: "pointer",
                      width: "100%",
                      transition: "background 0.2s"
                    }}
                  >
                    Descartar petição
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {paymentStep === 2 && (
          <>
            {/* Header Badge */}
            <div style={{
              width: isMobile ? "44px" : "56px",
              height: isMobile ? "44px" : "56px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: isMobile ? "0 auto 10px" : "0 auto 16px",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.1)"
            }}>
              <ShieldCheck size={isMobile ? 18 : 24} color="#10b981" />
            </div>

            <h2 style={{ 
              fontSize: isMobile ? "18px" : "22px", 
              marginBottom: isMobile ? "4px" : "8px", 
              color: "var(--text-primary)", 
              fontWeight: 800,
              letterSpacing: "-0.02em"
            }}>
              Finalizar Pedido
            </h2>
            <p style={{ 
              color: "var(--text-secondary)", 
              marginBottom: isMobile ? "14px" : "24px", 
              fontSize: isMobile ? "12px" : "14px", 
              lineHeight: "1.5" 
            }}>
              Realize o pagamento via Pix para liberar imediatamente a edição com IA e as opções de exportação em PDF e Word.
            </p>

            {isLoadingPix ? (
              <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div className="animate-spin" style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid var(--border)",
                  borderTopColor: "#f59f0b",
                  borderRadius: "50%"
                }} />
                <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500 }}>Gerando chave Pix segura...</span>
              </div>
            ) : pixData ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", width: "100%" }}>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ 
                    background: "#ffffff", 
                    padding: isMobile ? "12px" : "18px", 
                    borderRadius: "18px", 
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    border: "1.5px solid var(--border)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    <QRCodeSVG value={pixData.pixCode} size={isMobile ? 140 : 180} />
                  </div>
                  <span style={{ 
                    fontSize: "11px", 
                    color: "var(--text-muted)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px",
                    marginTop: "6px"
                  }}>
                    <Lock size={12} color="#10b981" /> QR Code oficial e criptografado
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "fit-content",
                  background: "rgba(245, 158, 11, 0.06)",
                  padding: "6px 14px",
                  borderRadius: "99px",
                  border: "1px solid rgba(245, 158, 11, 0.15)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ 
                      width: "6px", 
                      height: "6px", 
                      borderRadius: "50%", 
                      background: "#f59f0b", 
                      boxShadow: "0 0 8px #f59f0b",
                      animation: "pulseOrange 1.5s infinite" 
                    }} />
                    <span style={{ color: "#d97706", fontSize: "11px", fontWeight: 600 }}>Aguardando pagamento...</span>
                  </div>
                  <span style={{ 
                    fontFamily: "monospace", 
                    fontSize: "11.5px", 
                    fontWeight: 700, 
                    color: pixTimeLeft < 120 ? "#ef4444" : "#d97706" 
                  }}>
                    ({formatPixTime(pixTimeLeft)})
                  </span>
                </div>
                
                <button 
                  onClick={handleCopyPix}
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    padding: isMobile ? "12px 20px" : "14px 28px",
                    borderRadius: "12px",
                    fontWeight: 600,
                    fontSize: isMobile ? "14px" : "15px",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
                    transition: "all 0.2s ease",
                    transform: "translateY(0)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.filter = "brightness(1.08)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.filter = "brightness(1)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.2)";
                  }}
                >
                  Copiar Código Pix (Copia e Cola)
                </button>
                
                <span style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "-4px" }}>
                  Abra o app do seu banco, escolha &quot;Pix Copia e Cola&quot; e cole o código.
                </span>

                {isDev && (
                  <>
                    <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "10px 0" }} />
                    <button 
                      onClick={simulatePaymentSuccess}
                      style={{
                        background: "var(--surface-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px dashed var(--border)",
                        padding: isMobile ? "8px 16px" : "10px 20px",
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: isMobile ? "12px" : "13px",
                        cursor: "pointer",
                        width: "100%",
                        transition: "background 0.2s"
                      }}
                    >
                      Simular Pix Pago (Desenvolvimento)
                    </button>
                  </>
                )}

              </div>
            ) : null}
          </>
        )}
    </div>
  );

  if (!isActualModal) {
    return renderContent();
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--modal-overlay)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      {renderContent()}
    </div>
  );
}
