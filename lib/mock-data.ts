// lib/mock-data.ts
// ✅ 前端类型定义（已完全兼容真实后端字段）

// --------------------
// Target
// --------------------
export interface Target {
  target_id: string
  target_health: number
  max_health: number
  gps_lat: number
  gps_lng: number
  gps_alt?: number
  name: string
  description?: string
}

// --------------------
// Weapon（🔥 已按后端结构重写）
// --------------------
export interface Weapon {
  weapon_id: string
  weapon_name: string

  // 后端 Weapon.Status 映射
  status: "idle" | "busy" | "destroyed" | "maintain" | "loaded" | "unloaded" | "moved"

  // Weapon fields（来自后端）
  weapon_type?: number
  min_range?: number
  max_range?: number
  reload_time?: number
  direction?: number
  speed?: number
  attitude?: number
  hp?: number

  // 🔥 后端真实弹药字段
  ammo_type: number      // 当前弹药类型（0/1/2/3）
  ammo: number           // 剩余弹药数量（后端字段名：ammo）

  // 🔧 UI 用于定位 Firepower 中的武器（内部字段）
  combat_id?: string

  // （可选）当前执行的任务 ID
  current_task_id?: string
}

// --------------------
// Firepower（作战单位）
// --------------------
export interface Firepower {
  firepower_id: string
  name: string
  type: string
  gps_lat: number
  gps_lng: number
  gps_alt?: number
  weapons: Weapon[]
  description?: string
}

// --------------------
// Task
// --------------------
export interface Task {
  task_id: string
  start_time: string | null
  end_time?: string | null

  firepower_id: string
  weapon_id: string

  // 🔥 为保持 UI 中文显示，这里 ammo_type 继续使用 string
  ammo_type: string

  ammo_count: number
  target_id: string
  status: "pending" | "accepted" | "completed" | "failed"

  // UI 特效用
  weapon_lat?: number
  weapon_lng?: number
  weapon_alt?: number
  target_lat?: number
  target_lng?: number
  target_alt?: number
}

// --------------------
// Decision Result
// --------------------
export interface DecisionResult {
  firepower_id: string
  weapon_id: string
  ammo_type: string
  ammo_count: number
  target_id: string
}

// ========================================================
// 🔥 mock 数据（已改成与新 Weapon 结构兼容）
// ========================================================

// 目标
export const targets: Target[] = [
  {
    target_id: "tiananmen",
    name: "目标-天安门",
    gps_lat: 39.9087,
    gps_lng: 116.3975,
    target_health: 100,
    max_health: 100,
  },
  {
    target_id: "birdnest",
    name: "目标-鸟巢",
    gps_lat: 39.9929,
    gps_lng: 116.3969,
    target_health: 100,
    max_health: 100,
  },
  {
    target_id: "summer_palace",
    name: "目标-颐和园",
    gps_lat: 39.9996,
    gps_lng: 116.275,
    target_health: 100,
    max_health: 100,
  },
  {
    target_id: "capital_airport",
    name: "目标-机场",
    gps_lat: 40.0524,
    gps_lng: 116.613,
    target_health: 100,
    max_health: 100,
  },
]

// 火力单位 mock
export const mockFirepowers: Firepower[] = [
  {
    firepower_id: "FP001",
    name: "坦克A连",
    type: "主战坦克",
    gps_lat: 39.88,
    gps_lng: 116.375,
    weapons: [
      {
        weapon_id: "W001",
        weapon_name: "120mm坦克炮",
        status: "idle",
        ammo_type: 0, // 发爆弹
        ammo: 30,     // 库存
        max_range: 50,
      },
    ],
  },
]

// mock任务
export const mockTasks: Task[] = [
  {
    task_id: "TASK001",
    start_time: "2024-01-15T08:30:00",
    end_time: "2024-01-15T08:35:00",
    firepower_id: "FP001",
    weapon_id: "W001",
    ammo_type: "发爆弹",
    ammo_count: 3,
    target_id: "T004",
    status: "completed",
  },
]

// ========================================================
// 🔥 🔥 🔥 重要：AmmoStats 需要适配新数据结构（下一步修复）
// ========================================================

export function getAmmoStats() {
  // 新后端没有“多弹种”，因此简单按单弹药统计
  const stats: Record<string, { current: number; max: number }> = {}

  mockFirepowers.forEach((fp) => {
    fp.weapons.forEach((weapon) => {
      const type = String(weapon.ammo_type)
      if (!stats[type]) {
        stats[type] = { current: 0, max: 0 }
      }
      stats[type].current += weapon.ammo
      stats[type].max += weapon.max_range || 50
    })
  })

  return Object.entries(stats).map(([type, data]) => ({
    type,
    current: data.current,
    max: data.max,
    percentage: data.max > 0 ? Math.round((data.current / data.max) * 100) : 0,
  }))
}
