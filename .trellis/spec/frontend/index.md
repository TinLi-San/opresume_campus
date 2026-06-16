# 优派简历（OpResume）前端开发规范

## 项目概述

**优派简历**是一个基于 React 的在线简历生成器，核心特性：

- 🔒 **隐私优先**：简历数据默认仅存储在浏览器 localStorage；仅在用户主动使用 AI 功能时，将必要内容发送给用户配置的 AI 供应商
- 🎨 **专业排版**：多模板、多主题、精细化排版控制（页边距、行间距、模块间距）
- ✨ **极致体验**：所见即所得、拖拽排序、富文本编辑、自动分页
- 📦 **便捷导出**：JSON 导入导出、原生 PDF 打印（ATS 友好）

---

## 技术栈

| 类别 | 技术选型 | 版本 |
|------|---------|------|
| **框架** | React + Vite + TypeScript | 18 + 5 + 5 |
| **UI** | Radix UI + shadcn/ui + Tailwind CSS | - + - + 3 |
| **状态** | Zustand | 5 |
| **富文本** | Tiptap | 3 |
| **拖拽** | @dnd-kit | 6 |
| **动画** | Framer Motion | 11 |
| **国际化** | react-i18next | - |

---

## 核心数据格式：JSON Resume

### 标准字段

本项目遵循 [JSON Resume Schema](https://jsonresume.org/schema/) 标准，核心字段：

- `basics` - 基本信息（姓名、职位、联系方式）
- `work` - 工作经历
- `education` - 教育背景
- `projects` - 项目经历
- `skills` - 技能
- `awards` - 获奖荣誉

### 扩展字段规范（重要）

**新增字段时必须遵循**：

1. ✅ **先检查 JSON Resume 标准**：访问 https://jsonresume.org/schema/ 查看是否已有此字段
2. ✅ **如果标准中有**：直接使用标准字段名
3. ✅ **如果标准中没有**：使用 `x-op-` 前缀扩展

**扩展字段示例**：
```typescript
{
  "x-op-avatar": { width: 90, height: 126 },      // 头像配置
  "x-op-birthday": "1995-07-27",                  // 生日（用于计算年龄）
  "x-op-ageHidden": true,                         // 年龄是否隐藏
  "x-op-workExpYear": "5",                        // 工作年限
  "x-op-moduleHidden": { "profile": false },      // 模块隐藏状态
  "x-op-customFields": [{ key: "工作地点", value: "成都" }]
}
```

**为什么用 `x-op-` 前缀？**
- ✅ 遵循 JSON Resume 扩展规范
- ✅ 避免与未来标准字段冲突
- ✅ 清晰标识项目特定字段

---

## 规范文档索引

| 文档 | 说明 |
|------|------|
| [目录结构](./directory-structure.md) | 项目文件组织规范 |
| [组件指南](./component-guidelines.md) | React 组件设计模式 |
| [Hooks 指南](./hook-guidelines.md) | 自定义 Hook 开发规范 |
| [状态管理](./state-management.md) | Zustand 状态管理规范 |
| [类型安全](./type-safety.md) | TypeScript 类型定义规范 |
| [质量标准](./quality-guidelines.md) | 代码质量和性能要求 |

---

## 开发前检查清单

### 1. 熟悉项目约定
- [ ] 理解 JSON Resume 数据格式和扩展规范
- [ ] 了解 Zustand 状态管理
- [ ] 了解拖拽排序实现（@dnd-kit）
- [ ] 了解富文本编辑器（Tiptap）

### 2. 环境准备
- [ ] Node.js >= 18
- [ ] 运行 `npm install` 安装依赖
- [ ] 运行 `npm run dev` 启动开发服务器

### 3. 提交前质量检查
- [ ] TypeScript 编译通过：`npm run build`
- [ ] 功能正常工作（编辑、预览、拖拽、导出）
- [ ] 无 `console.log` 残留
- [ ] 新增字段遵循 JSON Resume 扩展规范

---

## 快速参考

**核心数据流**：
```
localStorage → Zustand Store → React Components → 用户交互 → Zustand Store → localStorage
```

**全局状态**：
- `useResumeStore` - 简历数据（JSON Resume 格式）
- `useUIStore` - UI 状态（模板、主题、编辑器）
- `useAIStore` - AI 供应商配置（仅在用户主动使用 AI 功能时参与请求）

**关键目录**：
- `src/components/Editor/` - 编辑器（表单、富文本、拖拽）
- `src/components/Resume/` - 简历渲染（模板、模块）
- `src/store/` - Zustand 状态管理
- `src/types/json-resume.ts` - JSON Resume 类型定义
- `src/config/` - 配置（主题、布局、图标、AI 供应商）

---

## 常见任务

### 添加新字段

1. **检查 JSON Resume 标准**：访问 https://jsonresume.org/schema/
2. **如果标准中有**：直接使用标准字段
3. **如果标准中没有**：
   - 在 `src/types/json-resume.ts` 中定义 `x-op-` 扩展字段
   - 在 `src/components/Editor/schemas.ts` 中定义表单 Schema
   - 在 `src/components/Resume/modules/` 中渲染字段

### 添加新模块

1. 在 `src/components/Resume/modules/` 创建模块组件
2. 在 `src/components/Editor/schemas.ts` 定义表单 Schema
3. 在 `src/components/Resume/modules/index.tsx` 注册模块

### 添加新模板

1. 在 `src/components/Resume/templates/` 创建 `template5.tsx`（小写 `template*.tsx`）
2. 默认导出 `TemplateDefinition` 对象
3. 模板会被 `src/components/Resume/templates/index.ts` 通过 `import.meta.glob` 自动注册，无需修改 `config/`

---

**语言**：所有文档使用**简体中文**编写
