"use client"

import { useEffect, useState } from "react"
import { Activity, Shield, Radio, SunMedium, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 初始渲染时 theme 可能是 undefined，这里默认按 dark 处理
  const isDark = theme === "dark" || theme === undefined

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-foreground">
            火力单元决策与任务派发可视化平台
          </h1>
          <p className="text-xs text-muted-foreground">
            Firepower Decision & Task Dispatch Visualization Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">系统在线</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            <span>实时监控</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-primary" />
            <span>通信正常</span>
          </div>
        </div>

        {/* 开灯 / 关灯按钮 */}
        {mounted && (
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-card transition-colors"
          >
            {isDark ? (
              <SunMedium className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
            <span className="text-muted-foreground">
              {isDark ? "开灯" : "关灯"}
            </span>
          </button>
        )}

        <div className="text-sm font-mono text-muted-foreground">
          {new Date().toLocaleString("zh-CN")}
        </div>
      </div>
    </header>
  )
}
