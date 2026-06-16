# Hooks 使用指南

> 优派简历项目的自定义 Hooks 开发规范

---

## 核心规则

1. ✅ 只在函数组件或自定义 Hook 顶层调用
2. ✅ 不在循环、条件或嵌套函数中调用
3. ✅ 自定义 Hook 以 `use` 开头命名

---

## 项目自定义 Hooks

### 1. useSaveShortcut - 快捷键保存

监听 Ctrl+S 快捷键保存简历，以及关闭页面前提示未保存。

```typescript
// src/hooks/useSaveShortcut.ts
export function useSaveShortcut() {
  const { t } = useTranslation();

  // 监听 Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveWithToast(t);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [t]);

  // 未保存时关闭页面提示
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useResumeStore.getState().dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}
```

### 2. useThemeEffect - 主题动画过渡

同步 UI Store 的主题配置到 CSS 变量，支持平滑动画过渡。

```typescript
// src/hooks/useThemeEffect.ts
export function useThemeEffect() {
  const theme = useUIStore((s) => s.theme);
  const layout = useUIStore((s) => s.layout);
  const reduceMotion = useReducedMotion() ?? false;

  // 主题色、字号、行高：直接设置
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--resume-primary', theme.color);
    root.style.setProperty('--resume-title-size', `${layout.titleFontSize}px`);
  }, [theme.color, layout.titleFontSize]);

  // 页边距：使用 framer-motion 平滑过渡
  useEffect(() => {
    const { y, x } = PAGE_MARGIN[layout.pageMargin];
    const stopY = tweenCssVar('--resume-page-padding-y', 'mm', y, reduceMotion);
    const stopX = tweenCssVar('--resume-page-padding-x', 'mm', x, reduceMotion);
    return () => { stopY(); stopX(); };
  }, [layout.pageMargin, reduceMotion]);
}
```

---

## 自定义 Hook 开发规范

### 1. 命名规范
```typescript
// ✅ 好的命名
useSaveShortcut()
useThemeEffect()
usePagination()

// ❌ 不好的命名
saveShortcut()     // 缺少 use 前缀
useData()          // 太泛泛
```

### 2. 参数设计
```typescript
// ✅ 推荐：对象参数
function usePagination({ pageSize = 10, initialPage = 1 }: Options) { }

// ✅ 推荐：简单参数
function useDebounce<T>(value: T, delay: number) { }
```

### 3. 返回值设计
```typescript
// ✅ 推荐：返回对象
function usePagination() {
  return { currentPage, totalPages, goToPage, nextPage };
}

// ✅ 推荐：返回数组（类似 useState）
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
}
```

---

## 常见 Hook 模式

### 1. 事件监听 Hook
```typescript
function useKeyPress(targetKey: string, handler: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === targetKey) handler();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, handler]);
}
```

### 2. 防抖 Hook
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 常见错误

### ❌ 错误 1：在条件中调用 Hook
```typescript
// ❌ 错误
if (enabled) {
  const [state, setState] = useState(0);
}

// ✅ 正确
const [state, setState] = useState(0);
if (!enabled) return null;
```

### ❌ 错误 2：忘记依赖项
```typescript
// ❌ 错误
useEffect(() => {
  doSomething(value);
}, []);  // 缺少 value

// ✅ 正确
useEffect(() => {
  doSomething(value);
}, [value]);
```

### ❌ 错误 3：不必要的 effect
```typescript
// ❌ 不必要
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ 直接派生
const fullName = firstName + ' ' + lastName;
```

---

## 相关文档

- [组件指南](./component-guidelines.md) - 组件开发规范
- [状态管理](./state-management.md) - Zustand 使用规范
