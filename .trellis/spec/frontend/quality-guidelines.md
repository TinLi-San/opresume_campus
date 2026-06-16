# 代码质量标准

> 优派简历项目的代码质量要求和最佳实践

---

## 禁止的模式

### ❌ 1. 使用 any 类型
```typescript
// ❌ 禁止
function processData(data: any) { }

// ✅ 正确
function processData(data: JsonResume) { }
```

### ❌ 2. 直接修改状态
```typescript
// ❌ 禁止
const items = useResumeStore((s) => s.work);
items[0].name = 'New';  // 不会触发重渲染

// ✅ 正确
const update = useResumeStore((s) => s.update);
update({ work: items.map((item, i) => i === 0 ? { ...item, name: 'New' } : item) });
```

### ❌ 3. 在渲染中执行副作用
```typescript
// ❌ 禁止
function Component() {
  setCount(1);  // 无限循环
  return <div />;
}

// ✅ 正确
function Component() {
  useEffect(() => setCount(1), []);
  return <div />;
}
```

### ❌ 4. 使用 index 作为 key（动态列表）
```typescript
// ❌ 禁止
{items.map((item, index) => <Item key={index} />)}

// ✅ 正确
{items.map((item) => <Item key={item['x-op-id']} />)}
```

### ❌ 5. console.log 在生产代码中
```typescript
// ❌ 禁止
console.log('Debug:', data);

// ✅ 调试完成后删除
```

---

## 必须的模式

### ✅ 1. TypeScript 严格类型
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive';
  onClick?: () => void;
}
```

### ✅ 2. 在需要稳定引用时使用 useCallback
```typescript
const handleDelete = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);

<ChildComponent onDelete={handleDelete} />
```

适合场景：回调传给 memoized 子组件、作为 Hook 依赖项、或已经确认存在重渲染成本。

### ✅ 3. 使用 cn 工具合并类名
```typescript
import { cn } from '@/lib/utils';

<div className={cn("base-class", isActive && "active-class")} />
```

### ✅ 4. 国际化文本
```typescript
const { t } = useTranslation();
<button>{t('common.save')}</button>

// ❌ 禁止硬编码
<button>保存</button>
```

---

## 性能要求

### 1. 避免不必要的重渲染
```typescript
// ✅ 使用选择器订阅
const name = useResumeStore((s) => s.config?.basics.name);

// ✅ 多字段订阅（推荐：多次订阅）
const template = useUIStore((s) => s.template);
const theme = useUIStore((s) => s.theme);

// 或使用 shallow 比较（如果需要）
import { shallow } from 'zustand/shallow';
const { template, theme } = useUIStore(
  (s) => ({ template: s.template, theme: s.theme }),
  shallow
);
```

### 2. 拖拽性能优化
```typescript
// ✅ 必须：拖动时隐藏原位置元素
const style = {
  transform: CSS.Transform.toString(transform),
  opacity: isDragging ? 0 : 1,  // 关键：隐藏被拖动的元素
};

// ✅ 必须：使用 pointer sensor 防止误触
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
);
```

### 3. 列表渲染优化
```typescript
// ✅ 使用稳定的 key
{items.map((item) => <Item key={item['x-op-id']} item={item} />)}
```

---

## 提交前检查清单

### 代码质量
- [ ] TypeScript 编译通过（`npm run build`）
- [ ] 无新增 `any` 类型（当前未配置 ESLint，需要人工 review 或 `rg "\bany\b" src` 辅助检查）
- [ ] 无新增 `console.log`（当前未配置 ESLint，需要人工 review 或 `rg "console\.log" src` 辅助检查）
- [ ] 用户可见文本使用 i18n（示例、配置、开发注释除外）
- [ ] 新增字段遵循 JSON Resume 扩展规范（`x-op-` 前缀）

### 功能验证
- [ ] 编辑器表单正常工作
- [ ] 简历预览实时更新
- [ ] 拖拽排序流畅无白屏
- [ ] PDF 导出正确
- [ ] localStorage 保存成功

### 性能检查
- [ ] 列表使用稳定的 key
- [ ] 回调使用 useCallback
- [ ] Store 订阅使用选择器

---

## 相关文档

- [组件指南](./component-guidelines.md) - 组件开发规范
- [Hooks 指南](./hook-guidelines.md) - 自定义 Hook 开发规范
- [状态管理](./state-management.md) - Zustand 使用规范
