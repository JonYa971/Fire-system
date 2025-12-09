"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Target, Firepower, DecisionResult } from "@/lib/mock-data"
import { Crosshair, AlertTriangle, CheckCircle, Rocket } from "lucide-react"

// 统一弹药类型码 → 中文名称（和 api 里的含义保持一致）
function ammoTypeLabel(code: number | string) {
  const n = Number(code)
  switch (n) {
    case 0:
      return "高爆弹"
    case 1:
      return "穿甲弹"
    case 2:
      return "制导弹"
    case 3:
      return "烟雾弹"
    default:
      return "未知弹种"
  }
}

// 下拉里可以选择的弹种（如果以后要扩展，只改这里就行）
const AMMO_TYPE_OPTIONS = ["高爆弹", "穿甲弹", "制导弹", "烟雾弹"]

interface DecisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: Target | null
  firepowers: Firepower[]
  onPublishTask: (decision: DecisionResult) => void
}

export function DecisionDialog({
  open,
  onOpenChange,
  target,
  firepowers,
  onPublishTask,
}: DecisionDialogProps) {
  const [selectedFirepower, setSelectedFirepower] = useState<string>("")
  const [selectedWeapon, setSelectedWeapon] = useState<string>("")
  const [ammoCount, setAmmoCount] = useState<number>(1)
  const [selectedAmmoType, setSelectedAmmoType] = useState<string>("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    message: string
  } | null>(null)

  const selectedFp = firepowers.find((fp) => fp.firepower_id === selectedFirepower)
  const selectedWp = selectedFp?.weapons.find((w) => w.weapon_id === selectedWeapon)

  // 当前武器默认弹种（来自后端 / mock）
  const defaultAmmoTypeText = selectedWp ? ammoTypeLabel(selectedWp.ammo_type) : ""
  // 如果用户没选，就用默认弹种
  const currentAmmoTypeText = selectedAmmoType || defaultAmmoTypeText
  const currentAmmoCount = selectedWp?.ammo ?? 0

  const resetState = () => {
    setSelectedFirepower("")
    setSelectedWeapon("")
    setAmmoCount(1)
    setSelectedAmmoType("")
    setIsValidating(false)
    setValidationResult(null)
  }

  const handleValidate = () => {
    setIsValidating(true)

    setTimeout(() => {
      if (!selectedWp) {
        setValidationResult({ valid: false, message: "请选择武器" })
      } else if (selectedWp.status === "busy") {
        setValidationResult({
          valid: false,
          message: "武器正在使用中，无法执行任务",
        })
      } else if (!currentAmmoTypeText || currentAmmoTypeText === "未知弹种") {
        setValidationResult({
          valid: false,
          message: "请选择弹药类型",
        })
      } else if (ammoCount <= 0) {
        setValidationResult({
          valid: false,
          message: "弹药数量必须大于 0",
        })
      } else if (ammoCount > currentAmmoCount) {
        setValidationResult({
          valid: false,
          message: `弹药不足（剩余 ${currentAmmoCount} 发）`,
        })
      } else {
        setValidationResult({
          valid: true,
          message: "决策验证通过，可以发布任务",
        })
      }

      setIsValidating(false)
    }, 400)
  }

  const handlePublish = () => {
    if (!target || !selectedFp || !selectedWp || !validationResult?.valid) return

    onPublishTask({
      firepower_id: selectedFirepower,
      weapon_id: selectedWeapon,
      // 这里仍然传中文字符串，lib/api.ts 里会用 ammoTypeToCode 转成 0/1/2/3
      ammo_type: currentAmmoTypeText,
      ammo_count: ammoCount,
      target_id: target.target_id,
    })

    resetState()
    onOpenChange(false)
  }

  const handleDialogOpenChange = (openValue: boolean) => {
    if (!openValue) {
      // 关闭时重置表单
      resetState()
    }
    onOpenChange(openValue)
  }

  if (!target) return null

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {/* 提高弹窗层级，避免被地图盖住 */}
      <DialogContent className="sm:max-w-[500px] bg-card border-border z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-chart-4" />
            决策结果 - 火炮打击任务
          </DialogTitle>
          <DialogDescription>
            针对目标{" "}
            <span className="text-chart-4 font-medium">{target.name}</span>{" "}
            的火炮打击任务决策
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 目标信息 */}
          <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-chart-4">目标信息</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {target.target_id} | 坐标: (
                  {target.gps_lat.toFixed(4)}, {target.gps_lng.toFixed(4)})
                </div>
              </div>
              <Badge className="bg-chart-4/20 text-chart-4">
                血量: {target.target_health}/{target.max_health}
              </Badge>
            </div>
          </div>

          {/* 选择火力单位 */}
          <div className="space-y-2">
            <Label>选择火力单位</Label>
            <Select
              value={selectedFirepower}
              onValueChange={(v) => {
                setSelectedFirepower(v)
                setSelectedWeapon("")
                setSelectedAmmoType("")
                setValidationResult(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择火力单位" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {firepowers.map((fp) => (
                  <SelectItem key={fp.firepower_id} value={fp.firepower_id}>
                    {fp.name} ({fp.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 选择武器 */}
          {selectedFp && (
            <div className="space-y-2">
              <Label>选择武器</Label>
              <Select
                value={selectedWeapon}
                onValueChange={(v) => {
                  setSelectedWeapon(v)
                  setValidationResult(null)
                  // 每次换武器时，把弹种重置为该武器默认的弹种
                  const wp = selectedFp.weapons.find((w) => w.weapon_id === v)
                  if (wp) {
                    setSelectedAmmoType(ammoTypeLabel(wp.ammo_type))
                  } else {
                    setSelectedAmmoType("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择武器" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {selectedFp.weapons.map((weapon) => (
                    <SelectItem key={weapon.weapon_id} value={weapon.weapon_id}>
                      {weapon.weapon_name}
                      {weapon.status === "busy" && " (使用中)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 弹药信息 + 数量（弹种可选） */}
          {selectedWp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>弹药类型</Label>
                <Select
                  value={currentAmmoTypeText}
                  onValueChange={(v) => {
                    setSelectedAmmoType(v)
                    setValidationResult(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择弹药类型" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {AMMO_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  剩余弹药：{currentAmmoCount} 发
                </p>
              </div>
              <div className="space-y-2">
                <Label>发射数量</Label>
                <Input
                  type="number"
                  min={1}
                  max={currentAmmoCount || 1}
                  value={ammoCount}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    setAmmoCount(Number.isNaN(n) ? 1 : n)
                    setValidationResult(null)
                  }}
                />
              </div>
            </div>
          )}

          {/* 决策摘要 */}
          {selectedWp && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="text-sm">
                <span className="text-muted-foreground">建议使用：</span>
                <span className="text-foreground font-medium">
                  {selectedFp?.name}（火力单位 #{selectedFirepower}）
                </span>
                <span className="text-muted-foreground"> 的 </span>
                <span className="text-foreground font-medium">
                  {selectedWp.weapon_name}
                </span>
                <span className="text-muted-foreground">，发射 </span>
                <span className="text-primary font-bold">{ammoCount}</span>
                <span className="text-muted-foreground"> 发 </span>
                <span className="text-foreground font-medium">
                  {currentAmmoTypeText}
                </span>
                <span className="text-muted-foreground">，对 </span>
                <span className="text-chart-4 font-medium">{target.name}</span>
                <span className="text-muted-foreground"> 进行火力打击。</span>
              </div>
            </div>
          )}

          {/* 验证结果 */}
          {validationResult && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                validationResult.valid
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-chart-4/10 border border-chart-4/30"
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-chart-4" />
              )}
              <span
                className={`text-sm ${
                  validationResult.valid ? "text-primary" : "text-chart-4"
                }`}
              >
                {validationResult.message}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={!selectedWp || isValidating}
          >
            {isValidating ? "验证中..." : "验证决策"}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!validationResult?.valid}
            className="bg-primary text-primary-foreground"
          >
            <Rocket className="w-4 h-4 mr-2" />
            发布任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
