# Deploy Checklist: opresume v1.8.1

**Date:** 2026-08-30 | **Deployer:** CI / 维护者 | **Environment:** Vercel (production, `main`)

## 本轮变更（3 commits，origin/main..main）

| Commit | 说明 |
| --- | --- |
| `dea5158` | P0/P1 导入质量修复：职位头衔、GPA 显示、技能分组+熟练度开关、课程一行多门、奖项日期保真、自我评价模块布局 |
| `ecb584c` | 落实 better-harness 报告 High/Medium 缺陷：单页收敛、导出页数断言、模板扩展文档、自定义布局增量合并、导入可中止 |
| `36133bf` | 模板栏目排序/命名统一、专业技能展示重设计、Template 7 排版放宽、全局行距 1.5→1.4 |

## Pre-Deploy
- [x] `tsc -b` 类型检查通过（无报错）
- [x] `npm run build` 生产构建通过（vite 10s，仅存既有 duration-* 类告警）
- [x] 导出回归 `scripts/export-regression.mjs` 10/10 PASS，默认样例 `pageCount=1`
- [x] 渲染抽查：template1/2/3/4/5/6/7 栏目顺序与版式正确
- [x] 无数据库迁移（纯前端，无 schema 变更）
- [x] 无 feature flag / 环境变量变更（`/api/opencode` 中转保持既有配置）
- [x] 回滚方案已记录（见下）
- [x] CHANGELOG v1.8.1 与本文档已提交

## Deploy
- [x] 提交并推送 `main`（含标准流程文档）
- [x] Vercel 已链接（`.vercel/project.json` → `opresume`），`main` 自动触发生产构建
- [ ] 构建状态 / 部署 URL 确认（`vercel inspect`）
- [ ] 关键用户流验证：编辑器打开、模板切换、导出 PDF

## Post-Deploy
- [ ] 确认线上为最新构建（检查 `/editor` 路由 200）
- [ ] 指标观察 15 分钟（错误率/延迟，Vercel 面板）
- [ ] 通知相关方，更新发布说明（CHANGELOG 已更新）

## Rollback Triggers
- Vercel 生产部署构建失败或 404
- `/editor` 路由不可用 / 导出 PDF 报错率上升
- 模板渲染缺块或栏目错乱（首页简历无法正确呈现）
- 回滚方式：`git revert` 异常 commit 并推送，或 Vercel 面板回退到上一部署
