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

> Deployed on Vercel at **[https://opresume.vercel.app](https://opresume.vercel.app)** — no install, no login required. Every push to `main` ships a new production build automatically.

## 📌 About This Fork

A fork of [oopooa/opresume](https://github.com/oopooa/opresume), focused on fresh-graduate resumes:

- 🎓 **Campus fresh-graduate template (default)**: one-page A4 compact layout, school badge upload with auto-extracted theme color, section-specific icons, and a bundled Donghua University badge with sample content
- 🤖 **Multiple AI providers**: DeepSeek, Qwen, Moonshot, MiniMax, Mimo, OpenCode, SiliconFlow, plus any OpenAI-compatible endpoint (BYOK, keys stay in your browser)
- 🧪 **Quality assurance**: built-in PDF import test scripts and fixtures (`scripts/`, `test-data/`)

## ✨ Key Features

### 🎨 Professional Typesetting Engine
- **Multi-dimensional layout control**: freely adjust margins, section spacing, line height, and theme color
- **Multiple classic templates**: 7+ industry templates (single-column, two-column, etc.), one-click switching
- **Smart auto-pagination**: visual page breaks when content exceeds A4 boundaries

### 🤖 AI-Powered Assistant
- **AI Resume Import**: upload a PDF and let AI extract and populate your data
- **AI Content Rewrite**: polish your resume content with one click

### 🚀 User Experience
- **WYSIWYG editing**: sidebar drawer forms with real-time preview on the main canvas
- **Privacy redaction mode**: one-click masking of name, phone, email, and other sensitive info
- **Drag & drop sorting**: reorder experience, projects, and other entries freely
- **Rich text editing**: bold, lists, links, plus auto-calculated age and years of experience

### 🔒 Data Security & Export
- **No login, zero upload**: all data stays in your browser
- **JSON import/export**: backup, migrate, or restore across devices
- **Native PDF export**: high-fidelity `window.print()` output with selectable text — ATS-friendly

---

## 🚀 Getting Started

### 🖥️ Use it online (recommended)

Open **[https://opresume.vercel.app](https://opresume.vercel.app)** and start building — no sign-up required.

### 🛠️ Local development (optional)

**Prerequisites**: Node.js >= 18, npm >= 8; the native TS test scripts under `scripts/` require Node.js >= 22.6.

```bash
git clone https://github.com/TinLi-San/opresume_campus.git
cd opresume_campus
npm install
npm run dev
```

Open `http://localhost:5173` (local dev server, for debugging only).

> Sync upstream: `git remote add upstream https://github.com/oopooa/opresume.git && git fetch upstream && git merge upstream/master`

### 📦 Build & Deploy

```bash
npm run build     # Production build (tsc -b && vite build)
npm run preview   # Preview the build locally
```

Wired to Vercel continuous deployment: pushing to `main` ships the production release automatically; pull requests get preview URLs.

---

## 🏗️ Tech Stack

| Category | Choice |
|----------|--------|
| Core Framework | React 18 + Vite 5 + TypeScript 5 |
| UI & Styling | Tailwind CSS 3 + shadcn/ui |
| State Management | Zustand 5 |
| Rich Text Editing | Tiptap 3 |
| Drag & Drop | @dnd-kit |
| Animation | Framer Motion 11 |
| Internationalization | react-i18next |

---

## 🗺️ Roadmap

- [x] JSON import/export, rich text editor, drag & drop sorting, two-column layout, template switching
- [x] Custom typography, smart pagination, privacy redaction, i18n
- [x] AI resume import/rewrite, multiple AI providers, campus fresh-graduate template
- [ ] AI resume scoring & analysis, multiple resume management, smart fit-to-page, more templates

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── Resume/            # Core resume rendering engine
│   │   ├── templates/     # Multiple templates (auto-registered)
│   │   └── modules/       # Base module renderers (experience, education, skills, etc.)
│   ├── Editor/            # Sidebar drawer & dynamic forms
│   ├── Toolbar/           # Top toolbar (appearance controls / export)
│   ├── Settings/          # Settings panel (AI provider configuration, etc.)
│   └── ui/                # shadcn/ui base component library
├── config/                # Configuration files
├── store/                 # Zustand state slices
├── services/              # Business logic (AI generation/polish, PDF parsing, data storage, etc.)
├── hooks/                 # Custom hooks (pagination, redaction logic, etc.)
└── types/                 # Global TypeScript type definitions
```

---

## 👥 Authors & Acknowledgments

- **Maintainer**: [TinLi-San](https://github.com/TinLi-San) — new features and maintenance of this fork
- **Upstream**: [oopooa/opresume](https://github.com/oopooa/opresume) ([MIT](LICENSE)) — the foundation of this repository; thanks to the original author for open-sourcing it

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to fork, submit PRs, or open issues!
