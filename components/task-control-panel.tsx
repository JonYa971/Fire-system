"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Task, Firepower, Target } from "@/lib/mock-data"
import { Clock, CheckCircle, AlertCircle, TargetIcon, Crosshair, Rocket, Loader2 } from "lucide-react"

interface TaskControlPanelProps {
  task: Task | null
  firepowers: Firepower[]
  targets: Target[]
  onAutoRun: () => void
  isProcessing: boolean
}

export function TaskControlPanel({
  task,
  firepowers,
  targets,
  onAutoRun,
  isProcessing,
}: TaskControlPanelProps) {
  if (!task) {
    return (
      <Card className="bg-card/50 border-border p-4">
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">选择一个任务查看详情</p>
          </div>
        </div>
      </Card>
    )
  }

  const firepower = firepowers.find((fp) => fp.firepower_id === task.firepower_id)
  const weapon = firepower?.weapons.find((w) => w.weapon_id === task.weapon_id)
  const target = targets.find((t) => t.target_id === task.target_id)

  const statusConfig = useMemo(() => {
    switch (task.status) {
      case "pending":
        return { color: "text-chart-3", bg: "bg-chart-3/20", label: "待执行" }
      case "accepted":
        // 文档里不会走 accept/complete；保留显示兼容
        return { color: "text-chart-3", bg: "bg-chart-3/20", label: "执行中" }
      case "completed":
        return { color: "text-primary", bg: "bg-primary/20", label: "已完成" }
      case "failed":
        return { color: "text-chart-4", bg: "bg-chart-4/20", label: "失败" }
    }
  }, [task.status])

  return (
    <Card className="bg-card/50 border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">任务控制面板</span>
        </div>
        <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>{statusConfig.label}</Badge>
      </div>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">任务ID</div>
            <div className="font-mono">{task.task_id}</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">目标</div>
            <div className="text-chart-4">{target?.name || task.target_id}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">火力单位</div>
            <div>{firepower?.name || task.firepower_id || "-"}</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">武器</div>
            <div>{weapon?.weapon_name || task.weapon_id}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">弹药类型</div>
            <div>{task.ammo_type}</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">弹药数量</div>
            <div className="text-primary font-bold">{task.ammo_count}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-muted/50">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            开始时间
          </div>
          <div className="font-mono text-xs">
            {task.start_time ? new Date(task.start_time).toLocaleString("zh-CN") : "-"}
          </div>
        </div>

        {task.end_time && (
          <div className="p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              结束时间
            </div>
            <div className="font-mono text-xs">{new Date(task.end_time).toLocaleString("zh-CN")}</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="text-xs text-muted-foreground mb-2">后端当前启用：一键自动执行待接任务（auto-run）</div>

        {task.status === "completed" ? (
          <div className="text-center py-2 text-primary text-sm flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            任务已完成
          </div>
        ) : task.status === "failed" ? (
          <div className="text-center py-2 text-chart-4 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            任务失败
          </div>
        ) : (
          <Button
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
            onClick={onAutoRun}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
            自动执行待接任务
          </Button>
        )}
      </div>
    </Card>
  )
}
