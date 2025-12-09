"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getAmmoStats } from "@/lib/mock-data"
import { Package } from "lucide-react"

export function AmmoStats() {
  const stats = getAmmoStats()

  return (
    <Card className="bg-card/50 border-border p-3">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">弹药库存</span>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.type} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{stat.type}</span>
              <span className="font-mono text-foreground">
                {stat.current}/{stat.max} ({stat.percentage}%)
              </span>
            </div>
            <Progress value={stat.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  )
}
