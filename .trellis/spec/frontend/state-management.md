# 状态管理规范

> 优派简历项目的 Zustand 状态管理规范

---

## 全局 Store

### 1. ResumeStore - 简历数据

```typescript
// src/store/resume.ts
interface ResumeStore {
  config: JsonResume | null;
  loading: boolean;
  error: string | null;
  saveError: string | null;
  dirty: boolean;
  
  load: () => Promise<void>;
  update: (
    partial: Partial<JsonResume> | ((prev: JsonResume) => Partial<JsonResume> | null),
  ) => void;
  save: () => Promise<void>;
  reset: () => void;
  clearSaveError: () => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  config: null,
  loading: true,
  error: null,
  saveError: null,
  dirty: false,

  update: (partial) => {
    const prev = get().config;
    if (!prev) return;
    const patch = typeof partial === 'function' ? partial(prev) : partial;
    if (!patch) return;
    const next = { ...prev, ...patch };
    set({ config: next, saveError: null, dirty: true });
  },
  
  // ... 其他方法
}));
```

### 2. UIStore - UI 状态

```typescript
interface UIStore {
  template: string;
  theme: ThemeConfig;
  lang: string;
  editorOpen: boolean;
  activeModule: string | null;
  layout: LayoutConfig;
  showIcons: boolean;
  privacyMode: boolean;
  settingsPanelOpen: boolean;
  
  setTemplate: (id: string) => void;
  openEditor: (module?: string) => void;
  // ...
}
```

### 3. AIStore - AI 配置

```typescript
interface AIStore {
  activeProviderId: AIProviderId | null;
  providers: Record<AIProviderId, AIProviderConfig>;
  updateProviderConfig: (providerId: AIProviderId, config: Partial<AIProviderConfig>) => void;
  setActiveProvider: (providerId: AIProviderId) => void;
  clearActiveProvider: () => void;
  getProviderConfig: (providerId: AIProviderId) => AIProviderConfig;
  // ...
}
```

---

## 使用模式

### 1. 选择器订阅（推荐）

```typescript
// ✅ 推荐：只订阅需要的字段
const name = useResumeStore((s) => s.config?.basics.name);

// ❌ 不推荐：订阅整个 store
const store = useResumeStore();  // 任何字段变化都会重渲染
```

### 2. 多字段订阅

```typescript
// 方式1：多次订阅（推荐，项目当前使用）
const template = useUIStore((s) => s.template);
const theme = useUIStore((s) => s.theme);

// 方式2：使用 shallow 比较（如果需要）
import { shallow } from 'zustand/shallow';
const { template, theme } = useUIStore(
  (s) => ({ template: s.template, theme: s.theme }),
  shallow
);
```

### 3. 只调用方法不订阅状态

```typescript
const update = useResumeStore((s) => s.update);  // ✅ 只获取方法

<button onClick={() => update({ basics: { name: 'New' } })}>
  Update
</button>
```

---

## 状态分类

### 全局状态（Zustand）
- ✅ 多个组件需要访问
- ✅ 需要在组件树间共享
- ✅ 需要持久化到 localStorage
- ✅ 需要被全局快捷键、工具栏、预览、编辑器等多个入口读写

### 本地状态（useState）
- ✅ 只在单个组件内使用
- ✅ 不需要持久化
- ✅ 临时 UI 状态

**注意**：不是所有全局状态都必须持久化。`useResumeStore` 的简历数据由 `services/resume.ts` 显式保存；`useUIStore` 和 `useAIStore` 使用 Zustand `persist` 持久化配置。

---

## 常见错误

### ❌ 错误 1：在渲染中调用 set

```typescript
// ❌ 错误（无限循环）
function Component() {
  const setTheme = useUIStore((s) => s.setTheme);
  setTheme('dark');  // 每次渲染都调用
  return <div>Theme</div>;
}

// ✅ 正确
function Component() {
  const setTheme = useUIStore((s) => s.setTheme);
  useEffect(() => setTheme('dark'), []);
  return <div>Theme</div>;
}
```

### ❌ 错误 2：直接修改状态

```typescript
// ❌ 错误
const config = useResumeStore((s) => s.config);
config.basics.name = 'New';  // 不会触发重渲染

// ✅ 正确
const update = useResumeStore((s) => s.update);
update({ basics: { ...config.basics, name: 'New' } });
```

---

## 相关文档

- [组件指南](./component-guidelines.md) - 组件开发规范
- [Hooks 指南](./hook-guidelines.md) - 自定义 Hook 开发规范
