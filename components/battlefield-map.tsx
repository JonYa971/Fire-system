"use client";

import dynamic from "next/dynamic";

// 动态导入 Leaflet 地图
const RealMap = dynamic(() => import("./real_map"), { ssr: false });

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Target, Firepower, Task } from "@/lib/mock-data";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface ProjectileAnimation {
  id: string;
  fromFirepowerId: string;
  toTargetId: string;
  damage: number;
  startTime: number;
}

export interface AttackLineAnimation {
  fromFirepowerId: string;
  toTargetId: string;
  showLine: boolean;
  showProjectile: boolean;
}

interface BattlefieldMapProps {
  targets: Target[];
  firepowers: Firepower[];
  tasks: Task[];
  selectedTarget: Target | null;
  onSelectTarget: (target: Target) => void;
  activeProjectile?: ProjectileAnimation | null;
  onProjectileComplete?: (targetId: string, damage: number) => void;
  attackLine?: AttackLineAnimation | null;
}

export function BattlefieldMap({
  targets,
  firepowers,
  tasks,
  selectedTarget,
  onSelectTarget,
  activeProjectile,
  onProjectileComplete,
  attackLine,
}: BattlefieldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [projectileProgress, setProjectileProgress] = useState(0);
  const [explosionTargetId, setExplosionTargetId] = useState<string | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 导弹飞行动画 + 爆炸效果
  useEffect(() => {
    // 如果当前没有需要显示的导弹，重置
    if (!attackLine?.showProjectile) {
      setProjectileProgress(0);
      return;
    }

    setProjectileProgress(0);
    let frameId: number;
    const duration = 1500; // 导弹飞行时间
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setProjectileProgress(progress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        // 飞行结束，触发爆炸
        setExplosionTargetId(attackLine.toTargetId);

        // 一段时间后清除爆炸效果
        setTimeout(() => {
          setExplosionTargetId(null);

          // 通知上层伤害结算
          if (activeProjectile) {
            onProjectileComplete?.(
              activeProjectile.toTargetId,
              activeProjectile.damage
            );
          }
        }, 600);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [attackLine, activeProjectile, onProjectileComplete]);

  // 映射给 RealMap 使用的攻击线（经纬度）
  const attackLineForRealMap = useMemo(() => {
    if (!attackLine) return undefined;
    const fromFp = firepowers.find(
      (fp) => fp.firepower_id === attackLine.fromFirepowerId
    );
    const toTarget = targets.find(
      (t) => t.target_id === attackLine.toTargetId
    );
    if (!fromFp || !toTarget) return undefined;

    return {
      fromLat: fromFp.gps_lat,
      fromLng: fromFp.gps_lng,
      toLat: toTarget.gps_lat,
      toLng: toTarget.gps_lng,
      showLine: attackLine.showLine,
      showMissile: attackLine.showProjectile,
    };
  }, [attackLine, firepowers, targets]);

  return (
    <Card
      className={`bg-card/50 border-border h-full flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none"
          : ""
      }`}
    >
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">战场态势图</span>
          <Badge variant="outline" className="text-xs ml-2">
            数字地形模型
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* 缩小 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setZoom((z) => Math.max(0.5, z - 0.2))
            }
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          {/* 放大 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setZoom((z) => Math.min(2, z + 0.2))
            }
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* 全屏 / 退出全屏 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsFullscreen((v) => !v)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 主视图区域 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 地图 */}
        <div className="absolute inset-0">
          <RealMap
            firepowers={firepowers}
            targets={targets}
            selectedTargetId={selectedTarget?.target_id ?? null}
            activeFirepowerId={
              attackLine?.fromFirepowerId ?? null
            }
            underAttackTargetId={
              attackLine?.toTargetId ?? null
            }
            attackLine={attackLineForRealMap}
            missileProgress={projectileProgress}
            explosionTargetId={explosionTargetId}
            zoom={zoom}
            onClickTarget={onSelectTarget}
          />
        </div>

        {/* HUD 网格 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground) / 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* 图例 */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded p-2 text-[8px] space-y-1 border border-slate-700/50">
          <div className="text-slate-400 font-medium mb-1 border-b border-slate-700 pb-1">
            图例
          </div>
          <div className="flex items-center gap-2">
            <svg width="8" height="8" viewBox="0 0 12 12">
              <polygon
                points="6,1 11,10 1,10"
                fill="#3b82f6"
              />
            </svg>
            <span className="text-slate-400">火力单位</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="8" height="8" viewBox="0 0 10 10">
              <circle
                cx="5"
                cy="5"
                r="3.5"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1"
              />
              <circle
                cx="5"
                cy="5"
                r="1"
                fill="#ef4444"
              />
            </svg>
            <span className="text-slate-400">目标</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t border-dashed border-orange-500" />
            <span className="text-slate-400">攻击路线</span>
          </div>
        </div>

        {/* 比例尺（与 zoom 同步显示数字，仅 UI） */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded px-2 py-1 text-[8px] border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-0.5 bg-slate-400 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-slate-400" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-slate-400" />
            </div>
            <span className="text-slate-400">
              {Math.round(5 / zoom)} km
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
