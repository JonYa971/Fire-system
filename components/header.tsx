"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, Shield, Radio, SunMedium, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 初始渲染时 theme 可能是 undefined，这里默认按 dark 处理
  const isDark = theme === "dark" || theme === undefined

  // 创建灯光爆炸效果
  const createLightBurst = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // 创建多个爆炸光环
    for (let i = 0; i < 3; i++) {
      const burst = document.createElement("div")
      burst.className =
        "fixed pointer-events-none rounded-full border-2 border-yellow-300"
      burst.style.left = centerX + "px"
      burst.style.top = centerY + "px"
      burst.style.width = "20px"
      burst.style.height = "20px"
      burst.style.transform = "translate(-50%, -50%)"
      burst.style.animation = `burst-expand 0.6s ease-out ${i * 0.1}s forwards`
      burst.style.boxShadow = `0 0 ${10 + i * 5}px rgba(253, 224, 71, 0.6)`

      document.body.appendChild(burst)

      setTimeout(() => burst.remove(), 600 + i * 100)
    }

    // 创建粒子效果
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div")
      const angle = (i / 8) * Math.PI * 2
      const distance = 60

      particle.className =
        "fixed pointer-events-none w-1 h-1 rounded-full bg-yellow-300"
      particle.style.left = centerX + "px"
      particle.style.top = centerY + "px"
      particle.style.opacity = "1"
      particle.style.boxShadow = `0 0 8px rgba(253, 224, 71, 0.8)`

      document.body.appendChild(particle)

      const fromX = centerX
      const fromY = centerY
      const toX = centerX + Math.cos(angle) * distance
      const toY = centerY + Math.sin(angle) * distance

      const duration = 0.5
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)

        particle.style.left = fromX + (toX - fromX) * progress + "px"
        particle.style.top = fromY + (toY - fromY) * progress + "px"
        particle.style.opacity = String(1 - progress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          particle.remove()
        }
      }

      requestAnimationFrame(animate)
    }

    // 闪光效果
    if (buttonRef.current) {
      const flash = document.createElement("div")
      flash.className = "fixed pointer-events-none inset-0"
      flash.style.backgroundColor = isDark
        ? "rgba(253, 224, 71, 0.2)"
        : "rgba(59, 130, 246, 0.15)"
      flash.style.animation = "flash 0.3s ease-out"
      flash.style.zIndex = "50"

      document.body.appendChild(flash)
      setTimeout(() => flash.remove(), 300)
    }
  }

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAnimating(true)
    createLightBurst(e)

    // 播放声音反馈（可选）
    if (typeof window !== "undefined") {
      const audioContext =
        (window as any).audioContext ||
        ((window as any).audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)())

      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const now = audioContext.currentTime
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc.connect(gain)
      gain.connect(audioContext.destination)

      if (isDark) {
        // 开灯 - 上升的音调
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1)
      } else {
        // 关灯 - 下降的音调
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)
      }

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

      osc.start(now)
      osc.stop(now + 0.1)
    }

    setTimeout(() => {
      setTheme(isDark ? "light" : "dark")
      setIsAnimating(false)
    }, 100)
  }

  return (
    <>
      {/* 灯光爆炸动画样式 */}
      <style>{`
        @keyframes burst-expand {
          from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          to {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }

        @keyframes flash {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .light-burst-button {
          position: relative;
          overflow: hidden;
        }

        .light-burst-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle,
            rgba(253, 224, 71, 0.3) 0%,
            transparent 70%
          );
          opacity: 0;
          animation: glow-pulse 2s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 transition-all duration-500">
            <Shield className="w-5 h-5 text-primary transition-colors duration-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-foreground transition-colors duration-500">
              火力单元决策与任务派发可视化平台
            </h1>
            <p className="text-xs text-muted-foreground transition-colors duration-500">
              Firepower Decision & Task Dispatch Visualization Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse transition-colors duration-500" />
              <span className="text-muted-foreground transition-colors duration-500">
                系统在线
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground transition-colors duration-500">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary transition-colors duration-500" />
              <span>实时监控</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-primary transition-colors duration-500" />
              <span>通信正常</span>
            </div>
          </div>

          {/* 增强的开灯 / 关灯按钮 */}
          {mounted && (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleToggleTheme}
              disabled={isAnimating}
              className="light-burst-button flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-card active:scale-95 transition-all duration-300 disabled:opacity-70 relative overflow-visible"
            >
              <div className="relative">
                {isDark ? (
                  <>
                    <SunMedium className="w-4 h-4 text-yellow-400 transition-all duration-300" />
                    <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-0 animate-pulse duration-500" />
                  </>
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-all duration-300" />
                )}
              </div>
              <span className="text-muted-foreground transition-colors duration-500">
                {isDark ? "开灯" : "关灯"}
              </span>
            </button>
          )}

          <div className="text-sm font-mono text-muted-foreground transition-colors duration-500">
            {new Date().toLocaleString("zh-CN")}
          </div>
        </div>
      </header>
    </>
  )
}
