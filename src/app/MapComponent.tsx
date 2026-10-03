"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import intersections from "../data/intersection.json";
import parkingData from "../data/parking.json";
import spotsData from "../data/spot.json";
import { fetchRoute, LatLngTuple } from "../utils/RouteService";
import { getSpotById, getParkingForSpot } from "../utils/parkingService";

// Next.jsでLeafletのデフォルトマーカー画像が表示されない問題を解決
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// アイコンの設定
const dangerIcon = L.icon({
  iconUrl: "/danger_icon.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const defaultParkingIcon = L.icon({
  iconUrl: "/parking_icon.svg",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// デフォルトの観光地ピンアイコン
const defaultSpotIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 出発地ピン（青バッジ）
const startMarkerIcon = L.divIcon({
  className: "custom-start-marker",
  html: `
    <div style="
      background-color: #2563eb;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(37,99,235,0.4);
      border: 3px solid white;
    ">
      📍
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// 目的地駐車場ピン（目立つ赤色バッジ）
const destinationParkingIcon = L.divIcon({
  className: "custom-dest-marker",
  html: `
    <div style="
      background-color: #dc2626;
      color: white;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 14px rgba(220,38,38,0.5);
      border: 3px solid white;
    ">
      🏁
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

// 選択された観光地用アイコン（星バッジ）
const spotStarIcon = L.divIcon({
  className: "custom-spot-star",
  html: `
    <div style="
      background-color: #f59e0b;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 10px rgba(245,158,11,0.5);
      border: 3px solid white;
    ">
      ⭐
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// 地図の表示範囲（Bounds）を自動同期するコンポーネント
function MapViewUpdater({
  start,
  goal,
  routePositions,
  hasDestination,
}: {
  start: LatLngTuple;
  goal: LatLngTuple | null;
  routePositions: LatLngTuple[];
  hasDestination: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!hasDestination) {
      // 目的地未選択時: 長崎市街地の観光地が全体的に見える初期位置
      map.setView([32.752, 129.872], 13);
      return;
    }

    if (routePositions.length > 0) {
      const bounds = L.latLngBounds(routePositions);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (goal) {
      const bounds = L.latLngBounds([start, goal]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [map, start, goal, routePositions, hasDestination]);

  return null;
}

export interface MapComponentProps {
  startLat?: number;
  startLng?: number;
  spotId?: string;
  onSelectSpot?: (spotId: string) => void;
  onClearSpot?: () => void;
}

const DEFAULT_START: LatLngTuple = [32.752405, 129.871058]; // 長崎駅

export default function MapComponent({
  startLat,
  startLng,
  spotId,
  onSelectSpot,
  onClearSpot,
}: MapComponentProps) {
  // 出発地座標
  const isCustomStart = startLat !== undefined && startLng !== undefined;
  const startPosition: LatLngTuple = useMemo(() => {
    return isCustomStart ? [startLat, startLng] : DEFAULT_START;
  }, [isCustomStart, startLat, startLng]);

  // 選択された観光地
  const selectedSpot = useMemo(() => {
    return spotId ? getSpotById(spotId) : undefined;
  }, [spotId]);

  // 観光地に紐づく駐車場
  const targetParking = useMemo(() => {
    return spotId ? getParkingForSpot(spotId) : undefined;
  }, [spotId]);

  // ゴール地点（目的地の駐車場、なければ観光地、未選択ならnull）
  const goalPosition: LatLngTuple | null = useMemo(() => {
    if (!spotId) return null;
    if (targetParking) {
      return [targetParking.lat, targetParking.lng];
    }
    if (selectedSpot) {
      return [selectedSpot.lat, selectedSpot.lng];
    }
    return null;
  }, [spotId, targetParking, selectedSpot]);

  const [routePositions, setRoutePositions] = useState<LatLngTuple[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);

  // ルート探索
  const loadRoute = async () => {
    if (!goalPosition) return;
    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchRoute(startPosition, goalPosition);

    if (result.error) {
      setErrorMessage(result.error);
      setRoutePositions([]);
      setRouteMessage(null);
    } else {
      setRoutePositions(result.coordinates);
      setRouteMessage(result.message || "ルートを取得しました");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // 目的地が選択されていない場合はルートをクリアして探索しない
    if (!goalPosition) {
      setRoutePositions([]);
      setIsLoading(false);
      setErrorMessage(null);
      setRouteMessage(null);
      return;
    }

    let ignore = false;

    async function execute() {
      if (!goalPosition) return;
      setIsLoading(true);
      setErrorMessage(null);

      const result = await fetchRoute(startPosition, goalPosition);
      if (ignore) return;

      if (result.error) {
        setErrorMessage(result.error);
        setRoutePositions([]);
        setRouteMessage(null);
      } else {
        setRoutePositions(result.coordinates);
        setRouteMessage(result.message || "ルートを取得しました");
      }

      setIsLoading(false);
    }

    execute();

    return () => {
      ignore = true;
    };
  }, [startPosition, goalPosition]);

  return (
    <div className="relative h-screen w-full">
      {/* スマホ最適化: 画面下部に配置するルート案内・目的地カード（上部メニューとの被りを解消） */}
      {spotId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-1.5rem)] max-w-md pointer-events-auto">
          {/* ① ローディング表示 */}
          {isLoading && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3.5 shadow-2xl backdrop-blur-md border border-blue-200 text-blue-900 animate-pulse">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <div className="text-xs sm:text-sm font-semibold">
                {selectedSpot
                  ? `「${selectedSpot.name}」へのおすすめ駐車場ルートを探索中...`
                  : "初心者向け大通りルートを探索中..."}
              </div>
            </div>
          )}

          {/* ② エラー時の警告表示 & 再試行ボタン */}
          {!isLoading && errorMessage && (
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-red-50/95 px-4 py-3.5 shadow-2xl backdrop-blur-md border border-red-200 text-red-900">
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">⚠️</span>
                <div>
                  <p className="text-sm font-bold">ルート探索に失敗しました</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadRoute}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-xl transition-colors font-bold shadow-sm"
              >
                再試行
              </button>
            </div>
          )}

          {/* ③ ルート取得完了時の案内カード */}
          {!isLoading && !errorMessage && selectedSpot && (
            <div className="rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur-md border border-slate-200/90 text-slate-800 transition">
              {/* カードヘッダー */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-base">
                    🎯
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {selectedSpot.name}
                    </h3>
                    {targetParking && (
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">
                        🅿️ 案内先: {targetParking.name}
                      </p>
                    )}
                  </div>
                </div>

                {onClearSpot && (
                  <button
                    type="button"
                    onClick={onClearSpot}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold transition shrink-0"
                    title="ルート案内を解除"
                    aria-label="ルート解除"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 駐車場メタ情報バッジ */}
              {targetParking && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                  {targetParking.price && (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium">
                      💴 {targetParking.price}
                    </span>
                  )}
                  {targetParking.capacity && (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium">
                      🚗 {targetParking.capacity}台
                    </span>
                  )}
                  {targetParking.url && (
                    <a
                      href={targetParking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-50 px-2 py-0.5 font-bold text-blue-600 hover:underline"
                    >
                      詳細 ↗
                    </a>
                  )}
                </div>
              )}

              {/* 長崎ローカルおせっかいアドバイス */}
              {selectedSpot.osekkai_message && (
                <div className="mt-2.5 rounded-2xl bg-amber-50/90 p-2.5 text-xs text-amber-900 border border-amber-200/80 leading-relaxed font-medium">
                  💡 {selectedSpot.osekkai_message}
                </div>
              )}

              {/* フッター: ルート情報 */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <span>🛣️</span> {routeMessage || "大通り優先ルートを案内中"}
                </span>
                <span className="text-[10px] text-slate-400">初心者安心</span>
              </div>
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={startPosition}
        zoom={13}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapViewUpdater
          start={startPosition}
          goal={goalPosition}
          routePositions={routePositions}
          hasDestination={!!spotId}
        />

        {/* OpenStreetMap（標準） */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 出発地マーカー（目的地選択時、または現在地取得時に表示） */}
        {(spotId || isCustomStart) && (
          <Marker position={startPosition} icon={startMarkerIcon}>
            <Popup>
              <div style={{ minWidth: "150px" }}>
                <strong style={{ color: "#2563eb", fontSize: "14px" }}>
                  📍 出発地 {isCustomStart ? "（現在地）" : "（長崎駅）"}
                </strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  座標: {startPosition[0].toFixed(4)},{" "}
                  {startPosition[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 目的地（駐車場）マーカー（目的地選択時のみ表示） */}
        {goalPosition && targetParking && (
          <Marker position={goalPosition} icon={destinationParkingIcon}>
            <Popup>
              <div style={{ minWidth: "180px" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  🏁 目的地駐車場
                </div>
                <strong
                  style={{
                    display: "block",
                    color: "#dc2626",
                    fontSize: "15px",
                  }}
                >
                  {targetParking.name}
                </strong>
                {selectedSpot && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#1d4ed8",
                      fontWeight: "600",
                    }}
                  >
                    🎯 「{selectedSpot.name}」におすすめの駐車場です
                  </p>
                )}
                {targetParking.price && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "#4b5563",
                    }}
                  >
                    料金: {targetParking.price}
                  </p>
                )}
                {targetParking.capacity && (
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "11px",
                      color: "#4b5563",
                    }}
                  >
                    収容台数: {targetParking.capacity}台
                  </p>
                )}
                {targetParking.url && (
                  <p style={{ margin: "2px 0 0", fontSize: "11px" }}>
                    <a
                      href={targetParking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      公式情報
                    </a>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* APIから座標データが取得できたら道路沿いのルートを描画 */}
        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* 交差点の注意箇所マーカー */}
        {intersections.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={dangerIcon}
          >
            <Popup>
              <div style={{ minWidth: "150px" }}>
                <strong style={{ color: "#d97706", fontSize: "14px" }}>
                  ⚠️ {spot.name}
                </strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#374151",
                  }}
                >
                  {spot.description}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* parking.json からその他の駐車場マーカーを描画（目的地選択時に周辺駐車場として表示） */}
        {parkingData.map((p: any) => {
          if (targetParking && p.id === targetParking.id) {
            return null;
          }
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={defaultParkingIcon}
            >
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong style={{ color: "#2563eb", fontSize: "14px" }}>
                    {p.name}
                  </strong>
                  {p.description && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      {p.description}
                    </p>
                  )}
                  {p.price && (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "11px",
                        color: "#6b7280",
                      }}
                    >
                      料金: {p.price}
                    </p>
                  )}
                  {p.capacity && (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "11px",
                        color: "#6b7280",
                      }}
                    >
                      収容台数: {p.capacity}台
                    </p>
                  )}
                  {p.url && (
                    <p style={{ margin: "2px 0 0", fontSize: "11px" }}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                        }}
                      >
                        詳細情報
                      </a>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 観光地（spot.json）のピンを描画 */}
        {spotsData.map((spot) => {
          const isSelected = selectedSpot?.id === spot.id;
          const associatedParking = getParkingForSpot(spot.id);

          return (
            <Marker
              key={`spot-${spot.id}`}
              position={[spot.lat, spot.lng]}
              icon={isSelected ? spotStarIcon : defaultSpotIcon}
            >
              <Popup>
                <div style={{ minWidth: "180px", maxWidth: "250px" }}>
                  <strong
                    style={{
                      color: "#1d4ed8",
                      fontSize: "15px",
                      display: "block",
                    }}
                  >
                    {isSelected ? `⭐ ${spot.name}（選択中）` : spot.name}
                  </strong>

                  <p
                    style={{
                      margin: "4px 0",
                      fontSize: "12px",
                      color: "#374151",
                      lineHeight: "1.4",
                    }}
                  >
                    {spot.description}
                  </p>

                  {spot.osekkai_message && (
                    <p
                      style={{
                        margin: "6px 0",
                        fontSize: "11px",
                        color: "#b45309",
                        backgroundColor: "#fef3c7",
                        padding: "5px 8px",
                        borderRadius: "6px",
                        lineHeight: "1.4",
                      }}
                    >
                      💡 {spot.osekkai_message}
                    </p>
                  )}

                  {/* 紐づく駐車場の事前案内 */}
                  {associatedParking && (
                    <div
                      style={{
                        margin: "6px 0",
                        padding: "5px 8px",
                        backgroundColor: "#eff6ff",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#1e40af",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      🅿️ 案内先駐車場: <strong>{associatedParking.name}</strong>
                    </div>
                  )}

                  {/* 「目的地に設定」ボタン */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectSpot) {
                        onSelectSpot(spot.id);
                      }
                    }}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: isSelected ? "#059669" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    {isSelected ? "✓ 目的地に設定中" : "🎯 目的地に設定"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
