// lib/api.ts
// 统一复用 mock-data 里的类型，避免重复定义
import type { Task, Target, Firepower, DecisionResult, Weapon } from "./mock-data"

// 如果你现在是直接连后端服务器，就用完整地址：
// 比如：http://1.2.3.4:8080/api/v1
// 你现在是通过 Nginx 反向代理，接口前缀已经是 /api/v1，所以保持这样就行
const API_BASE = "/api/v1"

// 方便以后改账号
const ADMIN_USERNAME = "admin1"
const ADMIN_PASSWORD = "123456"
const USER_USERNAME = "combat1"
const USER_PASSWORD = "123456"

// ======= 类型推导（🔥 新版，不再包含 ammos[]）=======
type WeaponType = Firepower["weapons"][number]

// 多带一个 combat_id，方便分组
type WeaponWithCombat = WeaponType & { combat_id: string }

// =====================
// 登录相关
// =====================
export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) throw new Error("登录失败")

  const data = await res.json()
  return data.token as string
}

async function loginAdmin() {
  return login(ADMIN_USERNAME, ADMIN_PASSWORD)
}
async function loginUser() {
  return login(USER_USERNAME, USER_PASSWORD)
}

export async function loginAndGetToken(role: "admin" | "user" = "admin") {
  return role === "admin" ? loginAdmin() : loginUser()
}

// =====================
// 通用带 token 的 GET
// =====================
async function authedGet(url: string, token: string) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`请求失败：${url}`)
  return res.json()
}

// =====================
// 映射 Task
// =====================
function mapApiTask(t: any): Task {
  let status: Task["status"]
  switch (t.status) {
    case 0: status = "pending"; break
    case 1: status = "accepted"; break
    case 2: status = "completed"; break
    case 3: status = "failed"; break
    default: status = "pending"
  }

  return {
    task_id: String(t.ID ?? t.task_id),
    start_time: t.start_time ?? null,
    end_time: t.end_time ?? null,
    firepower_id: String(t.combat_id ?? t.firepower_id),
    weapon_id: String(t.weapon_id),
    ammo_type: String(t.ammo_type),
    ammo_count: Number(t.ammo_count),
    target_id: String(t.target_id),
    status,
  }
}

// =====================
// 拉取火力单元
// =====================
export async function fetchFirepowerUnits(token: string): Promise<Firepower[]> {
  const data = await authedGet(`/firepower-units`, token)
  return (data as any[]).map((c) => ({
    firepower_id: String(c.ID ?? c.firepower_id),
    name: c.Name ?? c.name,
    description: c.Description ?? c.description ?? "",
    gps_lat: Number(c.Lat ?? 0),
    gps_lng: Number(c.Lng ?? 0),
    gps_alt: Number(c.Alt ?? 0),
    type: (c.Type ?? c.type ?? "火力单元") as Firepower["type"],
    weapons: [], // 稍后由 fetchWeapons() 填充
  }))
}

// =====================
// 拉取目标
// =====================
export async function fetchTargets(token: string): Promise<Target[]> {
  const data = await authedGet(`/targets`, token)
  return (data as any[]).map((t) => {
    const health = Number(t.health ?? 100)
    return {
      target_id: String(t.ID),
      name: t.Name ?? "未知目标",
      description: t.Description ?? "",
      gps_lat: Number(t.x ?? t.Lat ?? 0),
      gps_lng: Number(t.y ?? t.Lng ?? 0),
      gps_alt: Number(t.h ?? t.Alt ?? 0),
      target_health: health,
      max_health: Number(t.max_health ?? health),
    }
  })
}

// =====================
// Fetch Tasks
// =====================
export async function fetchTasks(token: string): Promise<Task[]> {
  const data = await authedGet(`/tasks`, token)
  return (data as any[]).map(mapApiTask)
}

// =====================
// Weapon 映射（🔥 新版）
// =====================
function mapApiWeapon(raw: any): WeaponWithCombat {
  let status: Weapon["status"]
  switch (raw.status) {
    case 2: status = "busy"; break   // WeaponStatusBusy
    case 4: status = "destroyed"; break
    case 3: status = "maintain"; break
    default: status = "idle"
  }

  return {
    weapon_id: String(raw.ID),
    weapon_name: raw.Name ?? "未命名武器",
    status,
    weapon_type: raw.unit_type,
    min_range: raw.min_range ?? 0,
    max_range: raw.max_range ?? 50,
    reload_time: raw.reload_time ?? 0,
    direction: raw.direction ?? 0,
    speed: raw.speed ?? 0,
    attitude: raw.attitude ?? 0,
    hp: raw.hp ?? 100,

    // 🔥 后端新模型：弹药类型 + 剩余数量
    ammo_type: Number(raw.ammo_type ?? 0),
    ammo: Number(raw.ammo ?? 0),

    combat_id: String(raw.combat_id ?? raw.firepower_id ?? ""),
  }
}

// =====================
// 拉取武器（🔥 新版，不再请求 /ammos）
// =====================
async function fetchWeapons(token: string): Promise<WeaponWithCombat[]> {
  const data = (await authedGet(`/weapons`, token)) as any[]
  return data.map(mapApiWeapon)
}

// =====================
// 综合初始化
// =====================
export async function fetchInitialData() {
  const token = await loginAdmin()

  const [firepowersRaw, targets, tasks, weapons] = await Promise.all([
    fetchFirepowerUnits(token),
    fetchTargets(token),
    fetchTasks(token),
    fetchWeapons(token),
  ])

  // 归类武器
  const firepowers: Firepower[] = firepowersRaw.map((fp) => {
    const weaponsForFp = weapons
      .filter((w) => w.combat_id === fp.firepower_id)
      .map((w) => {
        const { combat_id, ...rest } = w
        return rest
      })
    return { ...fp, weapons: weaponsForFp }
  })

  return { token, firepowers, targets, tasks }
}

/// =====================
// 发布任务（🔥 静态决策）
// =====================
export async function publishTaskApi(): Promise<Task[]> {
  const token = await loginAdmin()

  const res = await fetch(`${API_BASE}/battle/decide-static`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "静态决策失败")
  }

  const data = await res.json()

  // 兼容返回格式
  const tasks = data.tasks ?? data

  return (tasks as any[]).map(mapApiTask)
}


// =====================
// 接单 & 完成任务
// =====================
export async function acceptTaskApi(taskId: string) {
  const token = await loginUser()
  const res = await fetch(`${API_BASE}/tasks/${taskId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("接单失败")
  return mapApiTask(await res.json())
}

export async function completeTaskApi(taskId: string) {
  const token = await loginUser()
  const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("完成任务失败")
  return mapApiTask(await res.json())
}

// =====================
// 自动执行任务
// =====================
export async function autoRunTasksApi() {
  const token = await loginUser()
  const res = await fetch(`${API_BASE}/tasks/auto-run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
