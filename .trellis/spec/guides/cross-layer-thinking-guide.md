# 跨层思维指南

> **目的**：在实现前思考跨层级的数据流

---

## 问题所在

**大多数 bug 发生在层级边界，而不是层级内部。**

常见跨层 bug：
- 数据格式在层级间变化
- 多个层级以不同方式实现相同逻辑
- 某个层级丢失或转换错了数据

---

## 本项目的层级结构

优派简历是**纯前端项目**，层级结构简单清晰：

```
localStorage（持久化）
    ↕
Zustand Store（状态管理）
    ↕
React Components（UI 层）
    ├── Editor（编辑器）
    └── Resume（预览）
```

---

## 关键边界

| 边界 | 格式 | 验证点 |
|------|------|--------|
| localStorage ↔ Store | JSON 字符串 ↔ JsonResume 对象 | `loadResume()` / `saveResume()` |
| Store ↔ Editor | JsonResume 对象 ↔ 表单数据 | Editor 组件 |
| Store ↔ Resume | JsonResume 对象 ↔ 渲染数据 | Resume 组件 |

---

## 实现前检查清单

### 添加新字段时

- [ ] 在 `types/json-resume.ts` 中定义类型
- [ ] 先检查 JSON Resume 标准是否已有此字段
- [ ] 标准中没有的使用 `x-op-` 前缀扩展
- [ ] 在 `components/Editor/schemas.ts` 中定义表单 Schema
- [ ] 在 `components/Resume/modules/` 中渲染字段
- [ ] 确保 localStorage 序列化/反序列化正常

### 修改数据格式时

- [ ] 检查所有读取该字段的组件
- [ ] 检查是否需要数据迁移
- [ ] 测试从旧格式加载是否正常

---

## 常见边界问题

### 问题 1：富文本 HTML 与纯文本混用

**场景**：工作描述支持富文本（HTML），但某些地方只需要纯文本。

**解决**：
- 存储格式：统一使用 HTML（`x-op-workDescHtml`）
- 显示时：富文本区域用 `dangerouslySetInnerHTML`，纯文本区域用 `stripHtml()`

### 问题 2：日期格式不一致

**场景**：
- 输入：`<input type="month">` 返回 "YYYY-MM"
- 存储：JSON Resume 标准使用 "YYYY-MM" 或 "YYYY-MM-DD"
- 显示：需要中文 "2023年4月"

**解决**：
- 存储格式：统一使用 "YYYY-MM"
- 转换层：使用 `date-fns` 在显示时格式化

### 问题 3：拖拽排序后 ID 混乱

**场景**：拖拽排序后，列表项的 `x-op-id` 与实际位置不对应。

**解决**：
- 使用稳定的 ID（UUID 或时间戳）
- 不要用 index 作为 ID
- 拖拽只改变数组顺序，不改变 ID

---

## 组件间通信模式

### 模式 1：通过 Store 共享状态

```typescript
// Editor 组件修改数据
function Editor() {
  const update = useResumeStore((s) => s.update);
  
  const handleChange = (data: Partial<JsonResume>) => {
    update(data);  // 更新 Store
  };
}

// Resume 组件读取数据
function Resume() {
  const config = useResumeStore((s) => s.config);  // 订阅 Store
  return <div>{config?.basics.name}</div>;
}
```

### 模式 2：通过 Props 传递数据

```typescript
// 父组件
function Parent() {
  const items = useResumeStore((s) => s.config?.work ?? []);
  return <ListEditor items={items} onChange={handleChange} />;
}

// 子组件
function ListEditor({ items, onChange }: Props) {
  // 使用 props 中的数据
}
```

---

## 提交前检查清单

- [ ] 数据流向清晰
- [ ] 每个边界都有明确的格式定义
- [ ] 错误处理覆盖所有边界
- [ ] 测试了边界情况（null、空、无效数据）
- [ ] 没有层级泄漏（组件不依赖 Store 的内部实现）
