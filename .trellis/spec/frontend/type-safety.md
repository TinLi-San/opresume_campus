# TypeScript 类型安全规范

> 优派简历项目的 TypeScript 使用规范

---

## 核心类型：JSON Resume

### 标准字段

遵循 [JSON Resume Schema](https://jsonresume.org/schema/) 标准：

```typescript
// src/types/json-resume.ts
export interface JsonResumeBase {
  basics?: ResumeBasics;
  work?: ResumeWork[];
  education?: ResumeEducation[];
  projects?: ResumeProject[];
  skills?: ResumeSkill[];
  awards?: ResumeAward[];
}
```

### 扩展字段（x-op- 前缀）

```typescript
export interface JsonResume extends JsonResumeBase {
  'x-op-avatar'?: Avatar;
  'x-op-birthday'?: string;
  'x-op-ageHidden'?: boolean;
  'x-op-workExpYear'?: string;
  'x-op-moduleHidden'?: Record<string, boolean>;
  'x-op-moduleLayout'?: Record<string, ModuleLayout>;
  'x-op-titleNameMap'?: Record<string, string>;
  'x-op-customFields'?: CustomField[];
  'x-op-aboutmeHtml'?: string;
  'x-op-customModules'?: CustomModule[];
  'x-op-theme'?: ThemeConfig;
  'x-op-layout'?: LayoutConfig;
  'x-op-locales'?: Record<string, Partial<JsonResume>>;
}
```

**规则**：新增字段前先检查 JSON Resume 标准，标准中没有的使用 `x-op-` 前缀。

### 模块条目扩展字段

模块数组内的条目也可以使用 `x-op-` 前缀保存项目特定信息：

```typescript
interface JsonWork extends ResumeWork {
  'x-op-id'?: string;
  'x-op-departmentName'?: string;
  'x-op-workDescHtml'?: string;
}

interface JsonProject extends ResumeProject {
  'x-op-id'?: string;
  'x-op-type'?: 'project' | 'portfolio';
  'x-op-projectContentHtml'?: string;
}
```

**规则**：列表项必须使用稳定的 `x-op-id`，拖拽排序只改变数组顺序，不修改 ID。

---

## 类型定义规范

### 1. 接口 vs 类型别名

```typescript
// ✅ 使用 interface 定义对象
interface User {
  id: string;
  name: string;
}

// ✅ 使用 type 定义联合类型
type Status = 'pending' | 'success' | 'error';
type Nullable<T> = T | null;
```

### 2. 严格的 null 检查

```typescript
// ✅ 正确：处理 null/undefined
function getDisplayName(user: User | null): string {
  if (!user) return 'Guest';
  return user.name ?? 'Unknown';
}

// ✅ 使用可选链
const email = user?.profile?.email;

// ✅ 使用空值合并
const displayName = user?.name ?? 'Guest';
```

### 3. 常用类型模式

```typescript
// Record 类型
type ModuleHidden = Record<string, boolean>;

// Partial / Pick / Omit
type PartialUser = Partial<User>;
type UserBasic = Pick<User, 'id' | 'name'>;
type UserWithoutEmail = Omit<User, 'email'>;

// 联合类型
type TemplateId = 'template1' | 'template2' | 'template3';

// as const 断言
const TEMPLATES = {
  template1: 'classic',
  template2: 'modern',
} as const;
```

---

## React 类型模式

### 1. 组件 Props

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive';
  onClick?: () => void;
  children: React.ReactNode;
}

// 扩展原生属性
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
```

### 2. 事件处理

```typescript
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  updateValue(e.target.value);
}
```

### 3. Ref 类型

```typescript
const inputRef = useRef<HTMLInputElement>(null);

const Input = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <input ref={ref} {...props} />
);
```

---

## 禁止的模式

### ❌ 禁止 1：使用 any

```typescript
// ❌ 禁止
function processData(data: any) { }

// ✅ 正确：使用 unknown 或泛型
function processData(data: unknown) { }
function processData<T>(data: T) { }
```

### ❌ 禁止 2：强制类型断言

```typescript
// ❌ 禁止（危险）
const user = data as User;

// ✅ 正确：类型守卫
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

### ❌ 禁止 3：忽略 null 检查

```typescript
// ❌ 禁止（使用非空断言）
const name = user!.name;

// ✅ 正确：使用可选链
const name = user?.name ?? 'Unknown';
```

---

## 相关文档

- [组件指南](./component-guidelines.md) - 组件开发规范
- [状态管理](./state-management.md) - Zustand 使用规范
