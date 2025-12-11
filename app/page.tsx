"use client"

import { useState, useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import {
  BattlefieldMap,
  type ProjectileAnimation,
  type AttackLineAnimation,
} from "@/components/battlefield-map"
import { TaskList } from "@/components/task-list"
import { TaskTimeline } from "@/components/task-timeline"
import { FirepowerPanel } from "@/components/firepower-panel"
import { AmmoStats } from "@/components/ammo-stats"
import { DecisionDialog } from "@/components/decision-dialog"
import { TaskControlPanel } from "@/components/task-control-panel"

import { type Target, type Task, type Firepower } from "@/lib/mock-data"

import { fetchInitialData, publishTaskApi, autoRunTasksApi } from "@/lib/api"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CommandCenter() {
  const [targets, setTargets] = useState<Target[]>([])
  const [firepowers, setFirepowers] = useState<Firepower[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedFirepowerId, setSelectedFirepowerId] = useState<string>()

  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [activeProjectile, setActiveProjectile] = useState<ProjectileAnimation | null>(null)
  const [attackLine, setAttackLine] = useState<AttackLineAnimation | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // -------------------------------
  //  初始化：一次性加载全部数据
  // -------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const { targets, firepowers, tasks } = await fetchInitialData()
        setTargets(targets)
        setFirepowers(firepowers)
        setTasks(tasks)
      } catch (err) {
        console.error("加载初始数据失败:", err)
        setLoadError((err as any)?.message || "加载初始数据失败，请检查后端服务或控制台日志")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // -------------------------------
  //  地图点击目标 → 打开任务发布弹窗
  // -------------------------------
  const handleSelectTarget = useCallback((target: Target) => {
    if (target.target_health === 0) return
    setSelectedTarget(target)
    setDecisionDialogOpen(true)
  }, [])

  // -------------------------------
  //  发布任务（调用静态决策 /battle/decide-static）
  // -------------------------------
  const handlePublishTask = useCallback(
    async () => {
      try {
        setIsProcessing(true)
        setLoadError(null)

        // 调用后端静态决策（批量生成任务）
        const newTasks = await publishTaskApi()

        // 替换任务列表
        setTasks(newTasks)

        // 自动选中第一条任务
        setSelectedTask(newTasks[0] ?? null)

        // 关闭弹窗
        setDecisionDialogOpen(false)
      } catch (err) {
        console.error("发布任务失败:", err)
        setLoadError((err as any)?.message || "发布任务失败")
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  // -------------------------------
  //  一键自动执行任务
  // -------------------------------
  const handleAutoRun = useCallback(async () => {
    try {
      setIsProcessing(true)
      setLoadError(null)

      await autoRunTasksApi()

      const { targets, firepowers, tasks } = await fetchInitialData()
      setTargets(targets)
      setFirepowers(firepowers)
      setTasks(tasks)

      setSelectedTask((prev) => {
        if (!prev) return tasks[0] ?? null
        const found = tasks.find((t) => t.task_id === prev.task_id)
        return found ?? tasks[0] ?? null
      })
    } catch (err) {
      console.error("auto-run 失败:", err)
      setLoadError((err as any)?.message || "自动执行失败")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // -------------------------------
  //  击中动画
  // -------------------------------
  const handleProjectileComplete = useCallback((targetId: string, damage: number) => {
    setTargets((prev) =>
      prev.map((t) =>
        t.target_id === targetId
          ? { ...t, target_health: Math.max(0, t.target_health - damage) }
          : t,
      ),
    )
    setActiveProjectile(null)
    setAttackLine(null)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        正在从后端加载数据…
      </div>
    )
  }

  // -------------------------------
  //  渲染 UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 固定顶部：错误提示 + 统计卡片 + 标签栏 */}
        <div className="flex-0 p-4 space-y-4 border-b border-border">
          {loadError && (
            <div className="text-sm text-red-500 border border-red-500/40 rounded px-3 py-2">
              {loadError}
            </div>
          )}

          <StatsCards
            totalTargets={targets.length}
            destroyedTargets={targets.filter((t) => t.target_health === 0).length}
            activeTasks={tasks.filter((t) => t.status === "accepted").length}
            completedTasks={tasks.filter((t) => t.status === "completed").length}
            totalAmmoUsed={tasks
              .filter((t) => t.status === "completed")
              .reduce((sum, t) => sum + t.ammo_count, 0)}
          />

          <Tabs defaultValue="realtime" className="w-full">
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger value="realtime">实时作战</TabsTrigger>
              <TabsTrigger value="review">战后复盘</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="realtime" className="w-full h-full">
            {/* 实时作战区域 */}
            <TabsContent value="realtime" className="mt-0 p-4">
            {/* 顶部：任务时间轴 */}
            <TaskTimeline tasks={tasks} className="mb-4" />

            {/* 下方：三列布局 */}
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-360px)]">

              {/* 左侧：地图 */}
              <div className="col-span-5 h-full">
                <BattlefieldMap
                  targets={targets}
                  firepowers={firepowers}
                  tasks={tasks}
                  selectedTarget={selectedTarget}
                  onSelectTarget={handleSelectTarget}
                  activeProjectile={activeProjectile}
                  onProjectileComplete={handleProjectileComplete}
                  attackLine={attackLine}
                />
              </div>

              {/* 中间：任务列表 */}
              <div className="col-span-4 h-full">
                <TaskList
                  tasks={tasks}
                  firepowers={firepowers}
                  targets={targets}
                  onSelectTask={setSelectedTask}
                  selectedTaskId={selectedTask?.task_id}
                />
              </div>

              {/* 右侧：任务控制面板 + 火力单位面板 */}
              <div className="col-span-3 flex flex-col gap-4 h-full">
                <div className="bg-card/50 border border-border rounded-lg p-3 flex-0">
                  <TaskControlPanel
                    task={selectedTask}
                    firepowers={firepowers}
                    targets={targets}
                    onAutoRun={handleAutoRun}
                    isProcessing={isProcessing}
                  />
                </div>

                <div className="flex-1 min-h-0">
                  <FirepowerPanel
                    firepowers={firepowers}
                    selectedFirepowerId={selectedFirepowerId}
                    onSelectFirepower={(fp) => setSelectedFirepowerId(fp.firepower_id)}
                    onSelectWeapon={(fp, weapon) => setSelectedFirepowerId(fp.firepower_id)}
                  />
                </div>
              </div>

            </div>
          </TabsContent>

            {/* 战后复盘 */}
            <TabsContent value="review" className="mt-0 p-4">
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">

              <div className="col-span-8">
                <TaskList
                  tasks={tasks}
                  firepowers={firepowers}
                  targets={targets}
                  onSelectTask={setSelectedTask}
                  selectedTaskId={selectedTask?.task_id}
                />
              </div>

              <div className="col-span-4 space-y-4">
                <AmmoStats />
                <TaskControlPanel
                  task={selectedTask}
                  firepowers={firepowers}
                  targets={targets}
                  onAutoRun={handleAutoRun}
                  isProcessing={isProcessing}
                />
              </div>

            </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* 决策弹窗（已适配为无参数发布任务模式） */}
      <DecisionDialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
        target={selectedTarget}
        firepowers={firepowers}
        onPublishTask={handlePublishTask}  // 现在不传 decision
      />
    </div>
  )
}
