"use client"

import { Card } from "@/components/ui/card"
import type { Task } from "@/lib/mock-data"
import { Clock } from "lucide-react"

interface TaskTimelineProps {
  tasks: Task[]
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
  // ⭐ 安全获取时间戳（避免 null / invalid date 报错）
  const getStartTime = (t: Task) => {
    if (!t.start_time) return 0
    const d = new Date(t.start_time)
    const ts = d.getTime()
    return Number.isFinite(ts) ? ts : 0
  }

  // ⭐ 安全排序（不会因为 null 崩溃）
  const sortedTasks = [...tasks].sort((a, b) => getStartTime(a) - getStartTime(b))

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted-foreground"
      case "accepted":
        return "bg-chart-3"
      case "completed":
        return "bg-primary"
      case "failed":
        return "bg-chart-4"
      default:
        return "bg-muted-foreground"
    }
  }

  return (
    <Card className="bg-card/50 border-border p-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">任务时间轴</span>
      </div>

      {/* 时间线 */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {sortedTasks.map((task, index) => (
          <div key={task.task_id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-4 h-4 rounded-full ${getStatusColor(task.status)}
                  ${task.status === "accepted" ? "animate-pulse ring-2 ring-chart-3/30" : ""}
                `}
              />
              <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                {task.task_id.slice(-3)}
              </span>
            </div>

            {index < sortedTasks.length - 1 && (
              <div className="w-8 h-0.5 bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>待接单</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-chart-3" />
          <span>执行中</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-chart-4" />
          <span>失败</span>
        </div>
      </div>
    </Card>
  )
}
