# 目录结构规范

> 优派简历项目的文件组织规范

---

## 目录布局

```
src/
├── components/              # React 组件
│   ├── Editor/             # 编辑器（表单、富文本、拖拽）
│   ├── Resume/             # 简历渲染（模板、模块）
│   ├── Settings/           # 设置面板
│   ├── Toolbar/            # 工具栏
│   └── ui/                # shadcn/ui 基础组件
├── config/                 # 配置文件（主题、布局、图标、AI 供应商）
├── hooks/                  # 自定义 Hooks
├── i18n/                   # 国际化（locales/zh-CN.json、en-US.json）
├── lib/                    # 工具库（cn 等）
├── services/               # 业务服务（localStorage、AI）
├── store/                  # Zustand 状态管理
├── types/                  # TypeScript 类型定义
├── utils/                  # 通用工具函数
├── assets/                 # 静态资源（字体、图标）
└── constants/              # 常量定义
```

---

## 命名规范

### 文件命名
- **组件文件**：PascalCase（`EditorPanel.tsx`）
- **工具文件**：camelCase（`utils.ts`）
- **类型文件**：camelCase（`json-resume.ts`）

### 目录命名
- **组件目录**：PascalCase（`Editor/`、`Resume/`）
- **功能目录**：camelCase（`hooks/`、`store/`）

### 组件命名
- **功能组件**：功能 + 类型（`ListEditor`、`RichTextEditor`）
- **模块组件**：模块名 + Module（`WorkExpModule`、`ProjectModule`）
- **模板文件**：小写 `template` + 编号（`template1.tsx`、`template2.tsx`）
- **模板内部组件**：PascalCase（`Template1Shell`、`Template2Shell`）

---

## 模块组织原则

### 1. 按功能分组
相关组件放在同一目录：
- `components/Editor/` - 所有编辑器相关组件
- `components/Resume/modules/` - 所有简历模块组件

### 2. 导出集中管理
在 `index.ts` 中统一导出：
```typescript
// components/Resume/modules/index.tsx
export { ProfileModule } from './ProfileModule';
export { WorkExpModule } from './WorkExpModule';
```

### 3. 共享代码抽取
- `shared.tsx` - 模块内共享（如 `Resume/shared.tsx`）
- `utils/` - 全局共享工具函数
- `types/` - 全局共享类型

### 4. 配置与代码分离
主题、图标、布局等配置放在 `config/` 目录；模板定义放在 `components/Resume/templates/`，由模板注册中心自动发现。

---

## 新增功能时的文件放置

### 添加新的简历模块
1. `components/Resume/modules/NewModule.tsx` - 创建模块组件
2. `components/Resume/modules/index.tsx` - 导出模块
3. `components/Editor/schemas.ts` - 定义表单 Schema
4. `types/json-resume.ts` - 更新类型定义（使用 `x-op-` 扩展）

### 添加新的模板
1. `components/Resume/templates/template5.tsx` - 创建模板文件（必须匹配 `template*.tsx`）
2. 默认导出 `TemplateDefinition`
3. `components/Resume/templates/index.ts` 会自动扫描并注册，无需手动维护模板列表

### 添加新的全局状态
1. `store/newStore.ts` - 创建新的 Store
2. `store/index.ts` - 导出 Store

---

## 相关文档

- [组件指南](./component-guidelines.md) - 组件设计规范
- [状态管理](./state-management.md) - Zustand 使用规范
- [类型安全](./type-safety.md) - TypeScript 类型规范
