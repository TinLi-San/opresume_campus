<div align="center">

# OpResume

**No login, beautifully crafted online resume builder** — Data stored locally only, zero leak risk, export anytime

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment: Vercel](https://img.shields.io/badge/deployment-Vercel-black?logo=vercel&logoColor=white)](https://opresume.vercel.app)

[简体中文](./README.md) | English

**[👉 Get Started](https://opresume.vercel.app)**

<img src="docs/images/mockup.webp" alt="OpResume Preview" width="800" />

</div>

> 🚀 **Live online:** Deployed on Vercel at **[https://opresume.vercel.app](https://opresume.vercel.app)** — no install, no login required. Every push to `main` automatically ships a new production build.

## ✨ Highlights of This Fork

This repository is an enhanced fork of [oopooa/opresume](https://github.com/oopooa/opresume) (v1.5.3), **tuned specifically for fresh graduates**:

- 🎓 **Fresh Canvas campus template (Template 7, now the default)**
  - One-page A4 compact layout, academic black-dot / numbered lists, section-specific Lucide icons
  - **One-click school badge/logo upload**, with the theme color auto-extracted from the badge
  - Ships with the Donghua University badge and a complete fresh-graduate sample; the default demo data no longer includes redundant fields like "academic rank"
  - **New users land on this template by default** — no manual switching required
- 🤖 **More AI providers + custom endpoints**: DeepSeek, Qwen, Moonshot, MiniMax, Mimo, OpenCode, SiliconFlow, plus any OpenAI-compatible endpoint; BYOK model, keys stay in your browser
- 🧩 **School logo editor**: upload and adjust your school logo visually
- 🧪 **Quality assurance**: built-in PDF import test harness (`scripts/`) with 7 test fixtures (`test-data/`), covering text extraction, AI-structured parsing, and truth-table scoring

## ✨ Key Features

### 🎨 Professional Typesetting Engine
- **Multi-dimensional layout control**: Freely adjust margins, section spacing, and line height with sliders — no more Word formatting nightmares.
- **Multiple classic templates**: 7+ carefully curated industry-standard templates (including ATS-friendly styles, single-column corporate layouts, a two-column layout, and a Campus Fresh Graduate layout) with seamless one-click switching.
- **Campus Fresh Graduate template**: Built-in school badge/logo upload, section-specific Lucide icons, one-page A4 compact layout, and academic-style black-dot / numbered lists; ships with the Donghua University logo and a fresh-graduate sample by default.
- **Theme color customization**: 8+ meticulously crafted preset color themes to match the visual tone of different industries.
- **Smart auto-pagination**: Automatic visual page breaks when content exceeds A4 boundaries, with a modern floating page indicator.

### 🤖 AI-Powered Assistant
- **AI Resume Import**: Upload a PDF resume and let AI automatically extract and populate information for quick migration.
- **AI Content Rewrite**: Optimize your resume content with one click to enhance professionalism and clarity.

### 🚀 Ultimate User Experience
- **WYSIWYG editing**: Sidebar drawer-style form editing with real-time preview on the main canvas.
- **Privacy protection mode**: One-click redaction mode that automatically masks name, phone, email, and other sensitive info — perfect for sharing resumes in communities for review.
- **Smooth drag & drop sorting**: Powered by `@dnd-kit`, entries within work experience, project descriptions, and other sections can be freely reordered via drag and drop.
- **Rich text & smart calculation**: Tiptap-based rich text editor supports bold, lists, and links; the system also auto-calculates age and years of experience from birthday and start date.

### 🔒 Data Security & Export
- **No login, zero upload**: All data is stored exclusively in the browser's `localStorage` — no backend, no database, your privacy is fully in your hands.
- **JSON import/export**: One-click export of your complete resume configuration as a JSON file for backup, migration, or cross-device use; import existing configurations to restore instantly.
- **Native PDF export**: Uses the browser's native `window.print()` for high-fidelity export, with selectable text and **ATS-friendly** output.

---

## 🚀 Getting Started

### 🖥️ Use it online (recommended, no install)

Just open **[https://opresume.vercel.app](https://opresume.vercel.app)** and start building your resume — no sign-up, no login, and your data stays in the browser.

### 🛠️ Local development (optional, for developers/contributors)

**Prerequisites**:
- Development / build: [Node.js](https://nodejs.org) >= 18, npm >= 8 (use the current Active LTS — no specific version is pinned)
- Running the native TypeScript test scripts under `scripts/`: [Node.js](https://nodejs.org) >= 22.6 (native type-stripping support)

```bash
# 1. Clone this repository
git clone https://github.com/TinLi-San/opresume_campus.git
cd opresume_campus

# 2. Install dependencies
npm install

# 3. Start the dev server (Vite default port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser. Note: this is the **local dev server** for debugging only — for public access, use the online link above.

> Sync upstream: `git remote add upstream https://github.com/oopooa/opresume.git && git fetch upstream && git merge upstream/master`

### 📦 Build & Deploy

```bash
npm run build     # Production build (tsc -b && vite build, output to dist/)
npm run preview   # Preview the build locally
```

This repository is wired to **Vercel** continuous deployment: pushing to `main` builds and ships the production release ([https://opresume.vercel.app](https://opresume.vercel.app)) automatically; pull requests get preview URLs.

---

## 🏗️ Tech Stack

| Category | Choice |
|----------|--------|
| **Core Framework** | React 18 + Vite 5 + TS 5 |
| **UI & Styling** | Tailwind CSS 3 + shadcn/ui |
| **State Management** | Zustand 5 |
| **Rich Text Editing** | Tiptap 3 |
| **Drag & Drop** | @dnd-kit |
| **Animation** | Framer Motion 11 |
| **Internationalization** | react-i18next |

---

## 🗺️ Roadmap

- [x] Resume JSON import/export
- [x] Rich text editor
- [x] Drag & drop module sorting
- [x] Two-column layout with section drag & drop
- [x] Template switching
- [x] Custom typography settings
- [x] Smart pagination (single-column templates)
- [x] Privacy redaction mode
- [x] Internationalization (i18n) support
- [x] AI-powered resume import
- [x] AI rewrite
- [x] Campus Fresh Graduate template (school logo upload, section icons, single-page A4 fit)
- [x] Multiple AI provider support
- [x] School logo editor
- [ ] AI resume scoring & analysis
- [ ] Multiple resume management
- [ ] Smart fit-to-page
- [ ] More templates

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── Resume/            # Core resume rendering engine
│   │   ├── templates/     # 🌟 Multiple templates (auto-registered)
│   │   └── modules/       # Base module renderers (experience, education, skills, etc.)
│   ├── Editor/            # Sidebar drawer & dynamic forms
│   ├── Toolbar/           # Top toolbar (appearance controls / export)
│   ├── Settings/          # Settings panel (AI provider configuration, etc.)
│   └── ui/                # shadcn/ui base component library
├── config/                # Configuration files
│   └── ai-providers/      # AI provider configurations
├── store/                 # Zustand state slices
├── services/              # Business logic (AI generation/polish, PDF parsing, data storage, etc.)
├── hooks/                 # Custom hooks (pagination, redaction logic, etc.)
└── types/                 # Global TypeScript type definitions
```

---

## 👥 Authors & Acknowledgments

- **Maintainer**: [TinLi-San](https://github.com/TinLi-San) — new features and maintenance of this fork (Campus Fresh Graduate template, school logo editor, more AI providers, test harness, Vercel deployment)
- **Upstream**: [oopooa/opresume](https://github.com/oopooa/opresume) ([MIT](LICENSE)) — the foundation of this repository; thanks to the original author for open-sourcing it

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to fork, submit PRs, or open issues!

> This repository is a forked enhancement of [oopooa/opresume](https://github.com/oopooa/opresume): see [✨ Highlights of This Fork](#-highlights-of-this-fork) for what's new. The codebase originates from upstream and keeps the MIT license.