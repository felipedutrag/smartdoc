# ⚖️ SmartDoc / Extrajus — AI Legal Notification Engine & Statutory Notice Automation

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TipTap_Editor-000000?style=for-the-badge&logo=tiptap&logoColor=white" alt="TipTap" />
  <img src="https://img.shields.io/badge/Google_Gemini_Live_Voice-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Live" />
  <img src="https://img.shields.io/badge/Instant_Pix-32BCAD?style=for-the-badge&logo=pix&logoColor=white" alt="Instant Pix" />
</p>

---

## 📌 Overview

**SmartDoc** is an automated legal intake, drafting, and notification platform designed to convert informal consumer, civil, or business disputes into formal statutory notices within minutes.

Equipped with **Aura** (an AI legal triage voice assistant powered by Google Gemini Live), SmartDoc analyzes facts, references governing laws, and generates an actionable legal petition editable in a TipTap WYSIWYG editor with automated Pix unlocking and DOCX/PDF export.

---

## ✨ Key Features

- 🎙️ **Aura AI Voice Intake:** Real-time conversational triage via WebSocket streaming on Google Gemini Live.
- ⚡ **Multi-Model Inference Fallback:** Cascading pipeline across Gemini 2.5 Flash, 3.1 Pro, and 3.5 Flash for continuous reliability.
- 📝 **Rich TipTap WYSIWYG Editor:** In-line diff highlighting, custom blocks, formatting palette, and surgical AI revisions.
- 💳 **Integrated Instant Pix Checkout:** Automated QR code generation, webhook verification, and optional legal review upsells.
- 📄 **Multi-Format Export:** Client and server-side compilation into formatted Microsoft Word (`.docx`) documents and printable PDFs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI Library** | React 19, Radix UI, Tailwind CSS |
| **Rich Text Engine** | TipTap v3 Suite, ProseMirror |
| **AI Models** | Google Gemini (Live Voice & Flash models) |
| **Communication** | Resend API, Telegram alerts |
| **Document Export** | `html-to-docx`, `jspdf` |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/felipedutrag/smartdoc.git
cd smartdoc

# Install dependencies
npm install

# Run local development server
npm run dev
```

---

## 👤 Author

Developed by **Felipe Dutra**  
- **GitHub:** [@felipedutrag](https://github.com/felipedutrag)  
- **Email:** [felipedutra@outlook.com](mailto:felipedutra@outlook.com)
