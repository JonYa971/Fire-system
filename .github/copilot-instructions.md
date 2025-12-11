# AI 编码助手指南 - 火力单元决策与任务派发可视化平台

## 项目概览

这是一个**军事指挥火力分派系统**的 Next.js 前端应用，用于实时监控、决策和任务管理。系统使用 TypeScript + React 19 + Tailwind CSS，集成 Radix UI 组件库和 Leaflet 地图。

### 核心业务域
- **目标（Targets）**：地图上需要打击的军事目标，具有 GPS 坐标和血量
- **火力单元（Firepowers）**：部队单位，包含多个武器系统
- **武器（Weapons）**：火力单元内的具体武器，带弹药管理
- **任务（Tasks）**：从目标选择到武器分派的完整作战指令
- **决策系统**：静态决策引擎（`/battle/decide-static`）生成最优任务

---

## 架构与数据流

### 关键文件职责

| 文件/目录 | 职责 |
|---------|------|
| `app/page.tsx` | 主指挥中心，全局状态管理（targets, firepowers, tasks） |
| `lib/api.ts` | 后端 API 集成，数据映射，登录令牌管理 |
| `lib/mock-data.ts` | TypeScript 类型定义（Target, Firepower, Weapon, Task） |
| `components/battlefield-map.tsx` | 动态加载的 Leaflet 地图，显示目标和火力单元位置 |
| `components/decision-dialog.tsx` | 武器选择与弹药验证的核心决策对话框 |
| `lib/real-units-data.ts` | 真实武器数据参数（射程、装填时间等） |

### 数据流向

```
初始化 → fetchInitialData() → [targets, firepowers, tasks, weapons]
                ↓
         地图展示 + 统计卡片
                ↓
      用户点击目标 → DecisionDialog
                ↓
      选择武器 + 弹药类型 + 发射数量
                ↓
         验证逻辑检查
                ↓
      publishTaskApi() → /battle/decide-static
                ↓
         新任务列表 + 自动选中第一条
```

---

## 关键业务规则

### 1. 弹药类型映射
前端使用**中文字符串**显示，后端使用**数字代码**存储：

```typescript
// lib/mock-data.ts 中的转换
0 = "高爆弹"
1 = "穿甲弹"
2 = "制导弹"
3 = "烟雾弹"
```

**重要**：在 `decision-dialog.tsx` 中，`ammoTypeLabel()` 函数负责这个转换。修改弹种时必须同时更新这个函数和下拉菜单选项。

### 2. 武器状态管理
每个武器有 `status` 字段（从后端 `/weapons` 获取）：

```typescript
"idle" | "busy" | "destroyed" | "maintain" | "loaded" | "unloaded" | "moved"
```

- **busy** 状态的武器不能被选中执行新任务（在 `decision-dialog.tsx` 中验证）
- **ammo** 字段表示剩余弹药数量，不能超过时抛出错误

### 3. 火力单元的武器归类
`fetchInitialData()` 根据 `combat_id` 将武器分配给对应的火力单元：

```typescript
// lib/api.ts - 172 行
weapons.filter(w => w.combat_id === fp.firepower_id)
```

---

## 开发者工作流

### 启动开发服务器
```bash
pnpm dev
```
访问 `http://localhost:3000`

### 构建生产版本
```bash
pnpm build
pnpm start
```

### 代码检查
```bash
pnpm lint
```

### API 代理配置
在 `next.config.mjs` 中，所有 `/api/v1` 请求被代理到后端：
```javascript
source: '/api/v1/:path*',
destination: 'http://1.94.61.64:8080/api/v1/:path*'
```

---

## 常见模式与约定

### 1. React 组件结构
所有组件都标记为 `"use client"`（客户端组件）。使用 React 19 的 `useState` + `useCallback` + `useEffect`：

```typescript
"use client"
import { useState, useCallback, useEffect } from "react"

export function MyComponent() {
  const [state, setState] = useState<Type>(initialValue)
  const handleAction = useCallback(() => { /* ... */ }, [deps])
  
  useEffect(() => { /* setup */ }, [deps])
}
```

### 2. 类型安全性
所有组件和函数都有完整的 TypeScript 类型。通过 `lib/mock-data.ts` 中的接口定义复用类型，**不要在组件中重复定义**：

```typescript
import type { Target, Firepower, Task } from "@/lib/mock-data"
```

### 3. 地图集成
Leaflet 地图通过动态导入避免 SSR 问题（`components/real_map.tsx`）：

```typescript
const RealMap = dynamic(() => import("./real_map"), { ssr: false })
```

任何地图相关修改必须在 `real_map.tsx` 中进行，不要在 `battlefield-map.tsx` 中直接使用 Leaflet API。

### 4. UI 组件库（Radix UI）
所有按钮、对话框、下拉菜单来自 `components/ui/` 目录。这些是由 v0.app 生成的 Radix UI 包装组件，遵循统一的设计系统。

### 5. 主题系统
使用 `next-themes` 管理深色/浅色主题。在 `components/header.tsx` 中切换：

```typescript
const { theme, setTheme } = useTheme()
setTheme(isDark ? "light" : "dark")
```

---

## API 集成细节

### 登录与令牌
- 默认用户：`admin1 / 123456`（管理员），`combat1 / 123456`（操作员）
- 令牌通过 `loginAdmin()` 或 `loginUser()` 获取
- 所有认证请求使用 `Authorization: Bearer {token}` 头部

### 关键端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/firepower-units` | GET | 获取所有火力单元 |
| `/targets` | GET | 获取所有目标 |
| `/tasks` | GET | 获取所有任务 |
| `/weapons` | GET | 获取所有武器及弹药状态 |
| `/battle/decide-static` | POST | 静态决策，生成新任务 |
| `/tasks/{id}/accept` | PUT | 接单 |
| `/tasks/{id}/complete` | PUT | 完成任务 |
| `/auto-run-tasks` | POST | 自动执行所有待命任务 |

### 数据映射规则
`lib/api.ts` 中的 `mapApiTask()`、`mapApiWeapon()` 等函数负责将后端响应转换为前端类型。这些函数处理：
- 字段名称转换（如 `ID` → `task_id`）
- 状态码映射（0 = pending, 1 = accepted, 2 = completed, 3 = failed）
- 可选字段的默认值

---

## 决策对话框（决策系统核心）

### 工作流程
1. 用户在地图点击目标 → `handleSelectTarget()`
2. `DecisionDialog` 打开
3. 用户依次选择：火力单元 → 武器 → 弹药类型 → 发射数量
4. 系统自动验证（武器状态、弹药充足性）
5. 发布后调用 `publishTaskApi()`，返回新任务列表

### 关键验证逻辑（`decision-dialog.tsx` 第 87-107 行）
```typescript
// 武器正在使用中 → 禁止
if (selectedWp.status === "busy") { /* error */ }

// 弹药不足 → 禁止
if (ammoCount > currentAmmoCount) { /* error */ }

// 弹类型未选 → 禁止
if (!currentAmmoTypeText) { /* error */ }
```

### 弹药类型切换
每次换武器时，自动将弹种重置为该武器默认弹种：
```typescript
const wp = selectedFp.weapons.find(w => w.weapon_id === v)
if (wp) {
  setSelectedAmmoType(ammoTypeLabel(wp.ammo_type))
}
```

---

## 状态管理与副作用

### 主界面全局状态（`app/page.tsx`）
```typescript
const [targets, setTargets] = useState<Target[]>([])
const [firepowers, setFirepowers] = useState<Firepower[]>([])
const [tasks, setTasks] = useState<Task[]>([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
```

### 初始化模式
在 `useEffect` 中一次性调用 `fetchInitialData()`，然后全局缓存数据。不要频繁重新加载整个数据集，使用回调函数局部更新。

### 错误处理
所有 API 调用都在 try-catch 中包装，错误消息显示在 `loadError` 状态中，并展示在顶部错误区域。

---

## 扩展指南

### 添加新的弹药类型
1. 在 `decision-dialog.tsx` 的 `ammoTypeLabel()` 函数中添加新 case
2. 在 `AMMO_TYPE_OPTIONS` 下拉菜单中添加选项
3. 在 `lib/api.ts` 的 `mapApiWeapon()` 中同步后端弹种代码

### 修改武器显示信息
武器信息来自两个来源：
- 静态数据：`lib/real-units-data.ts`（射程、装填时间等参数）
- 动态数据：`/weapons` 端点（当前状态、弹药数量）

修改显示时需要同时更新组件和对应的数据源。

### 添加新的任务状态
在 `lib/mock-data.ts` 的 `Task` 接口中扩展 `status` 类型，然后在 `lib/api.ts` 的 `mapApiTask()` 中添加对应的状态码映射。

---

## 常见问题排查

### 问题：地图不显示
**原因**：Leaflet 使用浏览器 DOM API，不能在 SSR 中运行。
**解决**：检查 `battlefield-map.tsx` 第 3-4 行的动态导入是否正确：`ssr: false`

### 问题：武器列表为空
**原因**：`fetchWeapons()` 返回的数据可能没有正确的 `combat_id` 字段。
**解决**：在 `lib/api.ts` 的 `mapApiWeapon()` 中检查后端响应格式，确保 `combat_id` 被正确映射。

### 问题：弹药类型显示错误
**原因**：前后端弹种代码不同步。
**解决**：检查 `ammoTypeLabel()` 函数中的 case 语句是否与后端 API 文档一致。

### 问题：API 请求 404
**原因**：后端服务地址不正确或 Nginx 代理未配置。
**解决**：检查 `next.config.mjs` 中的 `destination` 地址是否正确。

---

## 技术栈总结

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4 + PostCSS
- **UI 库**：Radix UI (via v0.app)
- **地图**：Leaflet + react-leaflet
- **表单**：React Hook Form + Zod
- **图表**：Recharts
- **主题**：next-themes
- **包管理**：pnpm
- **部署**：Vercel (带 Analytics)

---

## 编码建议

1. **类型优先**：编写组件前先定义 TypeScript 接口
2. **复用状态映射**：如弹药类型、武器状态等，在 `lib/` 中集中维护转换逻辑
3. **API 错误处理**：始终提供用户友好的错误信息，记录完整错误到控制台
4. **组件分离**：将决策逻辑与 UI 分开，便于测试和复用
5. **避免深层 prop drilling**：如果状态层级过深，考虑提升到 `page.tsx` 全局管理

---

## 参考资源

- 类型定义：`lib/mock-data.ts`
- API 集成：`lib/api.ts` （包含所有端点和映射逻辑）
- UI 组件模板：`components/ui/` （所有可复用的 Radix UI 包装）
- 主页布局：`app/page.tsx` （完整的数据流和页面结构示例）
