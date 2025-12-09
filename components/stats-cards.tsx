"use client"

import { Target, Crosshair, Rocket, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsCardsProps {
  totalTargets: number
  destroyedTargets: number
  activeTasks: number
  completedTasks: number
  totalAmmoUsed: number
}

export function StatsCards({
  totalTargets,
  destroyedTargets,
  activeTasks,
  completedTasks,
  totalAmmoUsed,
}: StatsCardsProps) {
  const stats = [
    {
      label: "战场目标",
      value: totalTargets,
      icon: Target,
      color: "text-chart-4",
    },
    {
      label: "已摧毁",
      value: destroyedTargets,
      icon: Crosshair,
      color: "text-primary",
    },
    {
      label: "执行中任务",
      value: activeTasks,
      icon: Rocket,
      color: "text-chart-3",
    },
    {
      label: "已完成任务",
      value: completedTasks,
      icon: CheckCircle,
      color: "text-primary",
    },
    {
      label: "弹药消耗",
      value: totalAmmoUsed,
      icon: Rocket,
      color: "text-chart-2",
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
          </div>
        </Card>
      ))}
    </div>
  )
}
