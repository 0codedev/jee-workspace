# JEE Workspace v2.0

[![Live Production](https://img.shields.io/badge/Live-jee--workspace.vercel.app-blue?style=for-the-badge&logo=vercel)](https://jee-workspace.vercel.app)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **Cognitive JEE Advanced Diagnostic Engine, Formula Memory Vault & NTA CBT Simulator**  
> Engineered by **Sudhanshu Gaddam** ([@0codedev](https://github.com/0codedev)) -- NIT Warangal.

---

## 🏛️ System Architecture

```mermaid
graph TD
    UI["React 18 + Vite Luxury Dashboard<br/>(13-Tab Cognitive Workspace)"]
    Store["Zustand Reactive Store<br/>(Question Logs, Filters, Active Tests)"]
    SM2["SuperMemo SM-2 Engine<br/>(Spaced Repetition & Retention Decay)"]
    AI["Gemini 3.8 Flash AI Assistant<br/>(Step-by-Step Problem Solving & OCR)"]
    Storage["IndexedDB + Firebase Cloud Sync<br/>(Offline PWA Persistence)"]
    Export["Vector PDF Export Engine<br/>(Printable Mistake & Formula Notebooks)"]

    UI --> Store
    Store --> SM2
    Store --> AI
    Store --> Storage
    Store --> Export
```

---

## ⚡ Core Capabilities

- **13-Tab Diagnostic Workspace:** Seamlessly navigates question logs, formula vaults, syllabus tracking, rank prediction, and burnout recovery.
- **NTA CBT Exam Simulator:** Full parity with official JEE Computer-Based Test environments and ExamGOAL JSON imports.
- **Formula Vault & Memory Anchors:** High-pitfall formulas with KaTeX mathematical rendering and cross-subject conceptual bridges.
- **SM-2 Spaced Repetition:** Scientifically schedules question re-attempts based on memory decay curves.
- **Burnout & Fatigue Radar:** Tracks study velocity and alerts students before cognitive fatigue impacts test performance.
- **AI Problem Solving Tutor:** Powered by Google Gemini 3.8 Flash for instant conceptual breakdown and hint generation.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Math Rendering:** KaTeX, MathJax
- **State & Storage:** Zustand, IndexedDB, Firebase Cloud Firestore
- **AI Inference:** Google Gemini API (Gemini 3.8 Flash)
- **Deployment:** Vercel, PWA Offline Service Worker

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/0codedev/jee-workspace.git
cd jee-workspace
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Populate with your Gemini API key
```

### 3. Run Development Server
```bash
npm run dev
# Open http://localhost:5173 in your browser
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
