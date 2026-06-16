# 组件开发指南

> 优派简历项目的 React 组件设计规范

---

## 组件结构标准

```typescript
// 1. Imports（按类别分组）
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useResumeStore } from '@/store/resume';
import { cn } from '@/lib/utils';
import type { JsonResume } from '@/types/json-resume';

// 2. Types/Interfaces
interface ComponentProps {
  // Props 定义
}

// 3. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 3.1 Hooks（按顺序）
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  
  // 3.2 Effects
  useEffect(() => { /* ... */ }, [deps]);
  
  // 3.3 Event Handlers
  const handleClick = useCallback(() => { /* ... */ }, [deps]);

  // 3.4 Early Returns
  if (loading) return <Spinner />;

  // 3.5 Render
  return <div className={cn("base-class")}>{/* JSX */}</div>;
}
```

---

## Props 设计规范

### 1. Props 接口命名
```typescript
interface ListEditorProps {
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;  // ✅ onChange
  onDelete?: (index: number) => void;                     // ✅ onDelete
}
```

### 2. 避免布尔 Props 切换行为
```typescript
// ❌ 不推荐
<Button primary />

// ✅ 推荐
<Button variant="primary" />
```

### 3. 使用 children 传递内容
```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

<Card title="标题"><p>内容</p></Card>
```

---

## 样式规范

### 1. 使用 Tailwind CSS
```typescript
<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white">
```

### 2. 使用 cn 工具合并类名
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  props.className
)} />
```

### 3. 使用 CSS 变量控制主题
```typescript
<h2 style={{ color: 'var(--resume-primary)' }}>
```

---

## 性能优化

### 1. 在需要稳定引用时使用 useCallback
```typescript
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);  // ✅ 依赖项明确
```

适合场景：回调传给 memoized 子组件、作为 Hook 依赖项、或已经确认存在重渲染成本。普通本地事件处理不需要为了形式而包一层 `useCallback`。

### 2. 列表渲染使用稳定的 key
```typescript
{items.map((item) => (
  <Item key={item['x-op-id']} item={item} />  // ✅ 使用稳定 ID
))}
```

### 3. 避免把不稳定内联对象传给依赖引用相等的组件
```typescript
// ❌ 不推荐
<Component style={{ margin: 10 }} />

// ✅ 推荐
const STYLE = { margin: 10 };
<Component style={STYLE} />
```

如果对象只用于普通 DOM 元素或不会影响 memo/shallow 比较，可以保持简单，不必过度抽取。

---

## 无障碍访问（a11y）

### 1. 语义化 HTML
```typescript
<button>提交</button>          // ✅ 使用 button
<div onClick={...}>提交</div>  // ❌ 不要用 div
```

### 2. 添加 ARIA 标签
```typescript
<Button aria-label={t('common.delete')}>
  <Trash2 className="h-4 w-4" />
</Button>
```

---

## 常见错误

### ❌ 错误 1：在渲染中修改状态
```typescript
// ❌ 错误（无限循环）
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1);
  return <div>{count}</div>;
}

// ✅ 正确
function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => setCount(count + 1), []);
  return <div>{count}</div>;
}
```

### ❌ 错误 2：忘记 useCallback 的依赖项
```typescript
// ❌ 错误
const handleClick = useCallback(() => {
  doSomething(value);
}, []);  // 缺少 value

// ✅ 正确
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### ❌ 错误 3：过度使用 useEffect
```typescript
// ❌ 不必要的 effect
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ 直接计算
const fullName = firstName + ' ' + lastName;
```

---

## 实际案例：拖拽排序列表

```typescript
// src/components/Editor/ListEditor.tsx
export function ListEditor({ schema, items, onChange }: ListEditorProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = items.findIndex((i) => i['x-op-id'] === active.id);
    const newIndex = items.findIndex((i) => i['x-op-id'] === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  }, [items, onChange]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i['x-op-id'] as string)}>
        {items.map((item, index) => (
          <SortableItem key={item['x-op-id']} item={item} index={index} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**要点**：
- ✅ 使用 @dnd-kit 实现拖拽
- ✅ useCallback 优化性能
- ✅ 使用稳定的 ID 作为 key

---

## 相关文档

- [Hooks 指南](./hook-guidelines.md) - 自定义 Hook 开发规范
- [状态管理](./state-management.md) - Zustand 使用规范
- [类型安全](./type-safety.md) - TypeScript 类型规范
