"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Firepower, Weapon } from "@/lib/mock-data"
import { Shield, Plane, Crosshair, ChevronDown, ChevronRight, Zap, ChevronsLeft, ChevronLeft, ChevronRight as NavChevronRight, ChevronsRight } from "lucide-react"

// === 新增：后端 AmmoType 到中文名称的映射 ===
const ammoTypeLabel = (type: number | string | undefined): string => {
  const t = Number(type)
  switch (t) {
    case 0:
      return "发爆弹"
    case 1:
      return "浸彻爆破弹"
    case 2:
      return "云爆弹"
    case 3:
      return "烟雾弹"
    default:
      return "未知弹种"
  }
}

// === 默认最大弹药容量（后端未提供 max_count，需要前端自行定义）
const DEFAULT_MAX_AMMO = 50

interface FirepowerPanelProps {
  firepowers: Firepower[]
  selectedFirepowerId?: string
  onSelectFirepower: (fp: Firepower) => void
  onSelectWeapon: (fp: Firepower, weapon: Weapon) => void
}

export function FirepowerPanel({
  firepowers,
  selectedFirepowerId,
  onSelectFirepower,
  onSelectWeapon,
}: FirepowerPanelProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([firepowers[0]?.firepower_id])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")

  const PAGE_SIZE = 3

  // 计算分页数据
  const { paginatedData, totalPages } = useMemo(() => {
    const total = Math.ceil(firepowers.length / PAGE_SIZE)
    const start = (currentPage - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return {
      paginatedData: firepowers.slice(start, end),
      totalPages: Math.max(1, total),
    }
  }, [firepowers, currentPage])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const jumpTo = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(p)
  }

  const handleJump = () => {
    if (pageInput.trim()) {
      const p = parseInt(pageInput, 10)
      if (!isNaN(p)) jumpTo(p)
      setPageInput("")
    }
  }

  const getFirepowerIcon = (type: string) => {
    if (type.includes("坦克")) return Shield
    if (type.includes("无人机")) return Plane
    return Crosshair
  }

  return (
    <Card className="bg-card/50 border-border h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">火力单位</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {paginatedData.length} / {firepowers.length} 单位
        </Badge>
      </div>

      {/* 分页导航栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
        {/* 导航按钮 */}
        <button
          className={`h-6 w-6 inline-flex items-center justify-center rounded border text-xs ${
            currentPage === 1 ? "border-border/40 opacity-40 cursor-not-allowed" : "border-border hover:bg-muted/40"
          }`}
          onClick={() => jumpTo(1)}
          disabled={currentPage === 1}
          title="首页"
        >
          <ChevronsLeft className="w-3 h-3" />
        </button>

        <button
          className={`h-6 w-6 inline-flex items-center justify-center rounded border text-xs ${
            currentPage === 1 ? "border-border/40 opacity-40 cursor-not-allowed" : "border-border hover:bg-muted/40"
          }`}
          onClick={() => jumpTo(currentPage - 1)}
          disabled={currentPage === 1}
          title="上一页"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {/* 页码显示 */}
        <span className="text-xs text-muted-foreground px-1">
          {currentPage} / {totalPages}
        </span>

        <button
          className={`h-6 w-6 inline-flex items-center justify-center rounded border text-xs ${
            currentPage === totalPages ? "border-border/40 opacity-40 cursor-not-allowed" : "border-border hover:bg-muted/40"
          }`}
          onClick={() => jumpTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="下一页"
        >
          <NavChevronRight className="w-3 h-3" />
        </button>

        <button
          className={`h-6 w-6 inline-flex items-center justify-center rounded border text-xs ${
            currentPage === totalPages ? "border-border/40 opacity-40 cursor-not-allowed" : "border-border hover:bg-muted/40"
          }`}
          onClick={() => jumpTo(totalPages)}
          disabled={currentPage === totalPages}
          title="末页"
        >
          <ChevronsRight className="w-3 h-3" />
        </button>

        {/* 跳转输入 */}
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <span>跳转</span>
          <input
            className="h-6 w-10 rounded border border-border bg-muted/30 px-1 text-foreground text-xs outline-none focus:border-primary"
            value={pageInput}
            onChange={(e) => {
              const v = e.target.value
              if (v === "" || /^\d+$/.test(v)) setPageInput(v)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJump()
            }}
            placeholder="页"
          />
          <button
            className="h-6 px-1.5 rounded border border-border hover:bg-muted/40 text-xs text-foreground"
            onClick={handleJump}
          >
            转
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {paginatedData.map((fp) => {
            const Icon = getFirepowerIcon(fp.type)
            const isExpanded = expandedIds.includes(fp.firepower_id)
            const isSelected = selectedFirepowerId === fp.firepower_id
            const busyWeapons = fp.weapons.filter((w) => w.status === "busy").length

            return (
              <div key={fp.firepower_id} className="rounded-lg border border-border overflow-hidden">
                {/* 火力单位头部 */}
                <div
                  className={`
                    p-3 cursor-pointer transition-colors
                    ${isSelected ? "bg-primary/10" : "bg-card/30 hover:bg-card/50"}
                  `}
                  onClick={() => {
                    toggleExpand(fp.firepower_id)
                    onSelectFirepower(fp)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{fp.name}</div>
                        <div className="text-xs text-muted-foreground">{fp.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{fp.weapons.length} 武器</div>
                      {busyWeapons > 0 && (
                        <Badge className="bg-chart-3/20 text-chart-3 text-xs mt-1">{busyWeapons} 执行中</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 武器列表 - 限制高度并支持滚动 */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/30 max-h-64 overflow-y-auto">
                    <div className="p-2 space-y-2">
                      {fp.weapons.map((weapon) => {
                        const maxAmmo = weapon.max_range || DEFAULT_MAX_AMMO // 临时容量策略
                        const currentAmmo = Number(weapon.ammo ?? 0)
                        const percent = (currentAmmo / maxAmmo) * 100

                        return (
                          <div
                            key={weapon.weapon_id}
                            className={`
                              p-2 rounded-lg border cursor-pointer transition-all
                              ${
                                weapon.status === "busy"
                                  ? "border-chart-3/50 bg-chart-3/10"
                                  : "border-border bg-card/20 hover:bg-card/40"
                              }
                            `}
                            onClick={() => onSelectWeapon(fp, weapon)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">{weapon.weapon_name}</span>
                              <Badge
                                className={`text-xs ${
                                  weapon.status === "idle"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-chart-4/20 text-chart-4"
                                }`}
                              >
                                {weapon.status === "idle" ? "✓ 空闲" : "● 使用中"}
                              </Badge>
                            </div>

                            {/* 单一弹药槽（替代 ammos[]） */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {ammoTypeLabel(weapon.ammo_type)}
                                </span>
                                <span className="font-mono">
                                  {currentAmmo}/{maxAmmo}
                                </span>
                              </div>
                              <Progress value={percent} className="h-1.5" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}