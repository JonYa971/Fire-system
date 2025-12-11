"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Target, Firepower } from "@/lib/mock-data"

interface LatLng {
  lat: number
  lng: number
}

export type RealMapProps = {
  firepowers?: Firepower[]
  targets?: Target[]
  selectedTargetId?: string | null
  activeFirepowerId?: string | null
  underAttackTargetId?: string | null
  zoom?: number
  missileProgress?: number
  attackLine?: {
    fromLat: number
    fromLng: number
    toLat: number
    toLng: number
    showLine: boolean
    showMissile: boolean
  }
  explosionTargetId?: string | null
  onClickTarget?: (t: Target) => void
}

// ✅ 北京中心点（作为初始中心，会被 AutoFitBounds 覆盖）
const DEFAULT_CENTER: LatLng = { lat: 39.95, lng: 116.4 }
const DEFAULT_ZOOM = 10  // 初始缩放，会被自动调整覆盖

function isValidLatLng(lat: any, lng: any) {
  const la = Number(lat)
  const ln = Number(lng)
  return Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180
}

// 根据 zoom 因子同步 Leaflet zoom
// 注意：只在 zoomFactor !== 1 时才调整缩放，允许自适应缩放工作
function SyncZoom({ zoomFactor }: { zoomFactor: number }) {
  const map = useMap()
  useEffect(() => {
    // 只有在 zoomFactor 不是默认值 1 时才调整
    if (zoomFactor === 1) return
    
    const baseZoom = 13
    const leafletZoom = baseZoom + (zoomFactor - 1) * 2
    map.setZoom(leafletZoom)
  }, [zoomFactor, map])
  return null
}

// 自动 fitBounds - 自适应缩放到所有标记
function AutoFitBounds({ points }: { points: LatLng[] }) {
  const map = useMap()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (!map || !points || points.length === 0) {
      return
    }

    // 仅在第一次有数据时执行
    if (hasRunRef.current) return

    // 等待地图容器加载完成
    setTimeout(() => {
      try {
        console.log("AutoFitBounds 正在调整视图，点数:", points.length)
        
        // 创建 LatLngBounds
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
        
        // 使用 fitBounds 自动调整视图
        // 参数说明：
        // - padding: 边界填充（像素）
        // - maxZoom: 最大缩放级别，值越小显示范围越大
        // Leaflet 缩放级别：0=世界地图, 10=城市, 15=街道, 19=建筑
        map.fitBounds(bounds, {
          padding: [100, 100],    // 所有边都留 100px 空间
          maxZoom: 5,             // 降低到 5 显示更大范围（约500km+）
          animate: true,
          duration: 0.8
        })
        
        console.log("AutoFitBounds 调整完成")
        hasRunRef.current = true
      } catch (err) {
        console.error("AutoFitBounds 出错:", err)
      }
    }, 300)
  }, [map, points])

  return null
}

function fireIcon(isActive: boolean) {
  return L.divIcon({
    className: "",
    html: `
      <svg width="20" height="20" viewBox="0 0 12 12" style="transform: translate(-50%, -50%)">
        <polygon points="6,1 11,10 1,10"
          fill="${isActive ? "#3b82f6" : "#2563eb"}"
          stroke="#93c5fd" stroke-width="1"
        />
      </svg>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function targetIcon(isSelected: boolean, isUnderAttack: boolean) {
  const stroke = "#ef4444"
  return L.divIcon({
    className: "",
    html: `
      <div style="transform: translate(-50%, -50%); position:relative">
        <svg width="22" height="22" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4"
            fill="none"
            stroke="${stroke}"
            stroke-width="1"
            opacity="${isSelected || isUnderAttack ? 1 : 0.8}"
          />
          <line x1="5" y1="1" x2="5" y2="3.5" stroke="${stroke}" stroke-width="0.8"/>
          <line x1="5" y1="6.5" x2="5" y2="9" stroke="${stroke}" stroke-width="0.8"/>
          <line x1="1" y1="5" x2="3.5" y2="5" stroke="${stroke}" stroke-width="0.8"/>
          <line x1="6.5" y1="5" x2="9" y2="5" stroke="${stroke}" stroke-width="0.8"/>
          <circle cx="5" cy="5" r="1" fill="${stroke}" />
        </svg>

        ${
          isSelected
            ? `
          <svg width="32" height="32" viewBox="0 0 16 16"
            style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%)"
          >
            <rect x="1" y="1" width="14" height="14"
              fill="none"
              stroke="#22c55e"
              stroke-width="1"
              stroke-dasharray="2 2"
              rx="2"
            />
          </svg>
        `
            : ""
        }
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function explosionIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="transform:translate(-50%, -50%);">
        <div class="explode"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export default function RealMap(props: RealMapProps) {
  const {
    firepowers = [],
    targets = [],
    selectedTargetId,
    activeFirepowerId,
    underAttackTargetId,
    zoom = 1,
    attackLine,
    missileProgress = 0,
    explosionTargetId,
    onClickTarget,
  } = props

  // ✅ 北京中心点
  const [center] = useState<LatLng>(DEFAULT_CENTER)

  const validFirepowers = useMemo(
    () => firepowers.filter((fp) => isValidLatLng(fp.gps_lat, fp.gps_lng)),
    [firepowers],
  )
  const validTargets = useMemo(
    () => targets.filter((t) => isValidLatLng(t.gps_lat, t.gps_lng)),
    [targets],
  )

  // 调试：打印数据
  useEffect(() => {
    console.log("RealMap props:", { 
      firepowersCount: firepowers.length, 
      targetsCount: targets.length,
      validFirepowersCount: validFirepowers.length,
      validTargetsCount: validTargets.length,
    })
  }, [firepowers, targets, validFirepowers, validTargets])

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = []
    validFirepowers.forEach((fp) => pts.push({ lat: fp.gps_lat, lng: fp.gps_lng }))
    validTargets.forEach((t) => pts.push({ lat: t.gps_lat, lng: t.gps_lng }))
    
    if (pts.length > 0) {
      console.log("FitPoints 已准备:", pts)
    }
    
    return pts
  }, [validFirepowers, validTargets])

  const missileLatLng: LatLng | null = useMemo(() => {
    if (!attackLine?.showMissile) return null
    if (!(missileProgress > 0 && missileProgress <= 1)) return null
    const lat = attackLine.fromLat + (attackLine.toLat - attackLine.fromLat) * missileProgress
    const lng = attackLine.fromLng + (attackLine.toLng - attackLine.fromLng) * missileProgress
    return isValidLatLng(lat, lng) ? { lat, lng } : null
  }, [attackLine, missileProgress])

  const explosionTarget = explosionTargetId
    ? targets.find((t) => t.target_id === explosionTargetId)
    : null

  const explosionPos =
    explosionTarget && isValidLatLng(explosionTarget.gps_lat, explosionTarget.gps_lng)
      ? { lat: explosionTarget.gps_lat, lng: explosionTarget.gps_lng }
      : null

  return (
    <>
      <style>{`
        .explode {
          width: 80px;
          height: 80px;
          background: radial-gradient(
            circle,
            rgba(255,255,200,1) 0%,
            rgba(255,150,0,0.9) 35%,
            rgba(255,60,0,0.8) 55%,
            rgba(255,0,0,0.5) 70%,
            rgba(255,0,0,0) 100%
          );
          animation: boom 0.6s cubic-bezier(0.5, 0, 0, 1) forwards;
          border-radius: 50%;
          filter: blur(1px);
          pointer-events: none;
        }
        @keyframes boom {
          0% { transform: scale(0.1); opacity: 1; filter: blur(0px); }
          50% { transform: scale(2.2); opacity: 0.9; filter: blur(2px); }
          100% { transform: scale(3.4); opacity: 0; filter: blur(4px); }
        }
      `}</style>

      <div className="w-full h-full relative">
        {validTargets.length === 0 && validFirepowers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 rounded">
            <div className="text-center text-muted-foreground">
              <p>加载数据中...</p>
            </div>
          </div>
        )}
        
        <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ width: "100%", height: "100%" }} minZoom={8} maxZoom={18}>
          <SyncZoom zoomFactor={zoom} />
          <AutoFitBounds points={fitPoints} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxNativeZoom={19}
            maxZoom={20}
          />
          
          {/* 高德地图备用图层 - 可选 */}
          {/* <TileLayer
            url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
            subdomains={["1", "2", "3", "4"]}
          /> */}

          {validFirepowers.map((fp) => (
            <Marker
              key={fp.firepower_id}
              position={{ lat: fp.gps_lat, lng: fp.gps_lng }}
              icon={fireIcon(fp.firepower_id === activeFirepowerId)}
            >
              <Popup>{fp.name}</Popup>
            </Marker>
          ))}

          {validTargets.map((t) => (
            <Marker
              key={t.target_id}
              position={{ lat: t.gps_lat, lng: t.gps_lng }}
              icon={targetIcon(selectedTargetId === t.target_id, underAttackTargetId === t.target_id)}
              eventHandlers={{ click: () => onClickTarget?.(t) }}
            >
              <Popup>
                {t.name}（{t.target_health}HP）
              </Popup>
            </Marker>
          ))}

          {attackLine?.showLine &&
            isValidLatLng(attackLine.fromLat, attackLine.fromLng) &&
            isValidLatLng(attackLine.toLat, attackLine.toLng) && (
              <Polyline
                positions={[
                  [attackLine.fromLat, attackLine.fromLng],
                  [attackLine.toLat, attackLine.toLng],
                ]}
                pathOptions={{ color: "#f97316", weight: 3, dashArray: "10 6" }}
              />
            )}

          {missileLatLng && (
            <Marker
              position={missileLatLng}
              icon={L.divIcon({
                className: "",
                html: `
                  <div style="transform: translate(-50%, -50%)">
                    <div style="
                      width:10px;
                      height:10px;
                      background: radial-gradient(circle, yellow, red);
                      border-radius:50%;
                      box-shadow:0 0 10px rgba(255,100,0,.8);
                    "></div>
                  </div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          )}

          {explosionPos && <Marker position={explosionPos} icon={explosionIcon()} />}
        </MapContainer>
      </div>
    </>
  )
}
