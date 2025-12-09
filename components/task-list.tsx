"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Task, Firepower, Target } from "@/lib/mock-data"
import {
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  firepowers: Firepower[]
  targets: Target[]
  onSelectTask: (task: Task) => void
  selectedTaskId?: string
}

export function TaskList({
  tasks,
  firepowers,
  targets,
  onSelectTask,
  selectedTaskId,
}: TaskListProps) {
  const PAGE_SIZE = 3 // 每页 3 条

  const getStatusConfig = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return { icon: Clock, color: "text-chart-3", bg: "bg-chart-3/20", label: "待接单" }
      case "accepted":
        return { icon: Loader2, color: "text-chart-3", bg: "bg-chart-3/20", label: "执行中", spin: true }
      case "completed":
        return { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/20", label: "已完成" }
      case "failed":
        return { icon: AlertCircle, color: "text-chart-4", bg: "bg-chart-4/20", label: "失败" }
    }
  }

  const getFirepowerName = (id: string) =>
    firepowers.find((fp) => fp.firepower_id === id)?.name || id

  const getTargetName = (id: string) =>
    targets.find((t) => t.target_id === id)?.name || id

  const getWeaponName = (fpId: string, wId: string) => {
    const fp = firepowers.find((f) => f.firepower_id === fpId)
    return fp?.weapons.find((w) => w.weapon_id === wId)?.weapon_name || wId
  }

  // 安全地处理 start_time 可能为 null 的情况
  const getStartTime = (t: Task) => {
    if (!t.start_time) return 0
    const d = new Date(t.start_time)
    const ts = d.getTime()
    return Number.isFinite(ts) ? ts : 0
  }

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => getStartTime(b) - getStartTime(a)),
    [tasks],
  )

  // ===== 分页状态 =====
  const [page, setPage] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>("1")

  const total = sortedTasks.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // tasks 变化时，修正当前页
  useEffect(() => {
    setPage((p) => {
      const next = Math.min(Math.max(1, p), totalPages)
      return next
    })
  }, [totalPages])

  // 输入框跟随 page
  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  // 选中任务不在当前页时，自动跳到对应页
  useEffect(() => {
    if (!selectedTaskId) return
    const idx = sortedTasks.findIndex((t) => t.task_id === selectedTaskId)
    if (idx < 0) return
    const shouldPage = Math.floor(idx / PAGE_SIZE) + 1
    setPage((p) => (p === shouldPage ? p : shouldPage))
  }, [selectedTaskId, sortedTasks])

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)
  const pageTasks = sortedTasks.slice(startIndex, endIndex)

  const canPrev = page > 1
  const canNext = page < totalPages

  const jumpTo = (targetPage: number) => {
    const next = Math.min(Math.max(1, targetPage), totalPages)
    setPage(next)
  }

  const handleJump = () => {
    const n = Number(pageInput)
    if (!Number.isFinite(n) || n <= 0) return
    jumpTo(n)
  }

  // 页码按钮（最多显示 5 个）
  const pageNumbers = useMemo(() => {
    const max = 5
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const half = Math.floor(max / 2)
    let start = Math.max(1, page - half)
    let end = start + max - 1
    if (end > totalPages) {
      end = totalPages
      start = end - max + 1
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <Card className="bg-card/50 border-border h-full flex flex-col">
      {/* 顶部：标题 + 范围 */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">任务列表</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {total === 0 ? "0 条" : `${startIndex + 1}-${endIndex} / ${total}`}
          </Badge>
        </div>
      </div>

      {/* 分页控制条 */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60">
        {/* 左侧：每页固定 3 条 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>每页</span>
          <span className="px-2 py-1 rounded border border-border bg-muted/30 text-foreground">
            {PAGE_SIZE}
          </span>
          <span>条</span>
        </div>

        {/* 右侧：分页导航 + 跳转 */}
        <div className="flex items-center gap-2">
          {/* 首页 */}
          <button
            className={`h-7 w-7 inline-flex items-center justify-center rounded border ${
              canPrev ? "border-border hover:bg-muted/40" : "border-border/40 opacity-40 cursor-not-allowed"
            }`}
            onClick={() => canPrev && jumpTo(1)}
            disabled={!canPrev}
            aria-label="首页"
            title="首页"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* 上一页 */}
          <button
            className={`h-7 w-7 inline-flex items-center justify-center rounded border ${
              canPrev ? "border-border hover:bg-muted/40" : "border-border/40 opacity-40 cursor-not-allowed"
            }`}
            onClick={() => canPrev && jumpTo(page - 1)}
            disabled={!canPrev}
            aria-label="上一页"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 页码按钮 */}
          <div className="flex items-center gap-1">
            {pageNumbers[0] > 1 && (
              <>
                <button
                  className="h-7 px-2 rounded border border-border hover:bg-muted/40 text-xs"
                  onClick={() => jumpTo(1)}
                >
                  1
                </button>
                <span className="px-1 text-xs text-muted-foreground">…</span>
              </>
            )}

            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`h-7 px-2 rounded border text-xs ${
                  p === page
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/40"
                }`}
                onClick={() => jumpTo(p)}
              >
                {p}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                <span className="px-1 text-xs text-muted-foreground">…</span>
                <button
                  className="h-7 px-2 rounded border border-border hover:bg-muted/40 text-xs"
                  onClick={() => jumpTo(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* 下一页 */}
          <button
            className={`h-7 w-7 inline-flex items-center justify-center rounded border ${
              canNext ? "border-border hover:bg-muted/40" : "border-border/40 opacity-40 cursor-not-allowed"
            }`}
            onClick={() => canNext && jumpTo(page + 1)}
            disabled={!canNext}
            aria-label="下一页"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 末页 */}
          <button
            className={`h-7 w-7 inline-flex items-center justify-center rounded border ${
              canNext ? "border-border hover:bg-muted/40" : "border-border/40 opacity-40 cursor-not-allowed"
            }`}
            onClick={() => canNext && jumpTo(totalPages)}
            disabled={!canNext}
            aria-label="末页"
            title="末页"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* 输入跳转 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="ml-2">跳转</span>
            <input
              className="h-7 w-14 rounded border border-border bg-muted/30 px-2 text-foreground text-xs outline-none focus:border-primary"
              value={pageInput}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setPageInput(v)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJump()
              }}
              placeholder={`${page}`}
            />
            <span>/ {totalPages}</span>
            <button
              className="h-7 px-2 rounded border border-border hover:bg-muted/40 text-xs text-foreground"
              onClick={handleJump}
            >
              跳转
            </button>
          </div>
        </div>
      </div>

      {/* 列表内容（当前页） */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {pageTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status)
            const StatusIcon = statusConfig.icon
            const isSelected = selectedTaskId === task.task_id

            // 安全格式化时间
            let startTimeText = "-"
            if (task.start_time) {
              const d = new Date(task.start_time)
              if (!isNaN(d.getTime())) {
                startTimeText = d.toLocaleString("zh-CN")
              }
            }

            return (
              <div
                key={task.task_id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card/30 hover:bg-card/50"}
                `}
                onClick={() => onSelectTask(task)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {task.task_id}
                  </span>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} text-xs`}>
                    <StatusIcon
                      className={`w-3 h-3 mr-1 ${
                        statusConfig.spin ? "animate-spin" : ""
                      }`}
                    />
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">火力单位:</span>
                    <span className="text-foreground">
                      {getFirepowerName(task.firepower_id)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">武器:</span>
                    <span className="text-foreground">
                      {getWeaponName(task.firepower_id, task.weapon_id)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">目标:</span>
                    <span className="text-chart-4">
                      {getTargetName(task.target_id)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">弹药:</span>
                    <span className="text-foreground">
                      {task.ammo_type} x{task.ammo_count}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{startTimeText}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {total === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              暂无任务
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
