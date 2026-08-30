<div align="center">

# OpResume

**无需登录、精美排版的在线简历制作工具** — 数据仅保存在本地，零泄露风险，随时导出

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment: Vercel](https://img.shields.io/badge/deployment-Vercel-black?logo=vercel&logoColor=white)](https://opresume.vercel.app)

[English](./README.en.md) | 简体中文

**[👉 立即体验](https://opresume.vercel.app)**

<img src="docs/images/mockup.webp" alt="OpResume 预览" width="800" />

</div>

> 本项目已部署于 Vercel：**[https://opresume.vercel.app](https://opresume.vercel.app)**，无需安装、无需登录，打开即用；`main` 分支每次 push 自动发布生产版本。

## 📌 关于本 Fork

本仓库 fork 自 [oopooa/opresume](https://github.com/oopooa/opresume)，聚焦应届生简历场景：

- 🎓 **校园应届生模板（默认模板）**：一页 A4 紧凑排版，支持校徽上传（主题色自动提取）与栏目专属图标，预置东华大学校徽和示例内容
- 🤖 **多 AI 提供商**：支持 DeepSeek、Qwen、Moonshot、MiniMax、Mimo、OpenCode、硅基流动及任意 OpenAI 兼容端点（BYOK，密钥仅存本地）
- 🧪 **质量保障**：内置 PDF 导入测试脚本与测试夹具（`scripts/`、`test-data/`）

## ✨ 核心功能

### 🎨 专业排版引擎
- **多维布局控制**：自由调整页边距、模块间距、行高与主题色
- **多套经典模板**：单栏、双栏等 7+ 套行业通用模板，一键切换
- **智能自动分页**：内容超出 A4 边界时自动视觉分页

### 🤖 AI 智能助手
- **AI 简历导入**：上传 PDF，AI 自动解析并回填信息
- **AI 内容润色**：一键优化简历内容

### 🚀 用户体验
- **所见即所得编辑**：抽屉式表单编辑，主画布实时预览
- **隐私保护模式**：一键打码，隐藏姓名、电话、邮箱等敏感信息
- **拖拽排序**：经历、项目等条目自由拖拽排序
- **富文本编辑**：支持加粗、列表、链接，自动计算年龄与工作年限

### 🔒 数据安全与导出
- **无需登录、零上传**：数据仅保存在浏览器本地
- **JSON 导入/导出**：备份、迁移、跨设备使用
- **原生 PDF 导出**：`window.print()` 高保真导出，文字可选中，ATS 友好

---

## 🚀 使用方式

### 🖥️ 在线使用（推荐）

打开 **[https://opresume.vercel.app](https://opresume.vercel.app)** 即可开始制作简历，无需注册登录。

### 🛠️ 本地开发（可选）

**环境要求**：Node.js ≥ 18，npm ≥ 8；运行 `scripts/` 下的原生 TS 测试脚本需 Node.js ≥ 22.6。

```bash
git clone https://github.com/TinLi-San/opresume_campus.git
cd opresume_campus
npm install
npm run dev
```

访问 `http://localhost:5173`（本地开发模式，仅供本机调试）。

> 同步上游：`git remote add upstream https://github.com/oopooa/opresume.git && git fetch upstream && git merge upstream/master`

### 📦 构建与部署

```bash
npm run build     # 生产构建（tsc -b && vite build）
npm run preview   # 本地预览构建产物
```

已接入 Vercel 持续部署：push 到 `main` 自动发布生产版，PR 自动生成预览链接。

---

## 🏗️ 技术栈

| 类别 | 选型 |
|------|------|
| 核心框架 | React 18 + Vite 5 + TypeScript 5 |
| UI 与样式 | Tailwind CSS 3 + shadcn/ui |
| 状态管理 | Zustand 5 |
| 富文本编辑 | Tiptap 3 |
| 拖拽排序 | @dnd-kit |
| 动画 | Framer Motion 11 |
| 国际化 | react-i18next |

---

## 🗺️ 路线图

- [x] JSON 导入/导出、富文本编辑、拖拽排序、双栏布局、模板切换
- [x] 自定义排版、智能分页、隐私打码、国际化
- [x] AI 简历导入/润色、多 AI 提供商、校园应届生模板
- [ ] AI 简历评分与分析、多简历管理、智能一页适配、更多模板

---

## 📁 项目结构

```text
src/
├── components/
│   ├── Resume/            # 核心简历渲染引擎
│   │   ├── templates/     # 多套模板（自动注册）
│   │   └── modules/       # 基础模块渲染器（经历、教育、技能等）
│   ├── Editor/            # 侧边抽屉与动态表单
│   ├── Toolbar/           # 顶部工具栏（外观控制/导出）
│   ├── Settings/          # 设置面板（AI 提供商配置等）
│   └── ui/                # shadcn/ui 基础组件库
├── config/                # 配置文件
├── store/                 # Zustand 状态切片
├── services/              # 业务逻辑（AI 生成/润色、PDF 解析、数据存储等）
├── hooks/                 # 自定义 hooks（分页、打码逻辑等）
└── types/                 # 全局 TypeScript 类型定义
```

---

## 👥 作者与致谢

- **维护者**：[TinLi-San](https://github.com/TinLi-San) — 本 Fork 的新增功能与维护
- **上游项目**：[oopooa/opresume](https://github.com/oopooa/opresume)（[MIT](LICENSE)）— 本仓库的基础，感谢原作者的开源贡献

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。欢迎 fork、提交 PR 或提出 issue！
