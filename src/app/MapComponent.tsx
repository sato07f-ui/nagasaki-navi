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
import "./MapComponent.css";

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
  html: `<div class="map-marker-pin map-marker-start">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// 目的地駐車場ピン（目立つ赤色バッジ）
const destinationParkingIcon = L.divIcon({
  className: "custom-dest-marker",
  html: `<div class="map-marker-pin map-marker-destination">🏁</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

// 選択された観光地用アイコン（星バッジ）
const spotStarIcon = L.divIcon({
  className: "custom-spot-star",
  html: `<div class="map-marker-pin map-marker-spot">⭐</div>`,
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
    <div className="map-wrapper">
      {/* スマホ最適化: 画面下部に配置するルート案内・目的地カード（上部メニューとの被りを解消） */}
      {spotId && (
        <div className="map-bottom-overlay">
          {/* ① ローディング表示 */}
          {isLoading && (
            <div className="map-glass-card map-loading-card">
              <svg
                className="map-loading-spinner"
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
              <div className="map-loading-text">
                {selectedSpot
                  ? `「${selectedSpot.name}」へのおすすめ駐車場ルートを探索中...`
                  : "初心者向け大通りルートを探索中..."}
              </div>
            </div>
          )}

          {/* ② エラー時の警告表示 & 再試行ボタン */}
          {!isLoading && errorMessage && (
            <div className="map-glass-card map-error-card">
              <div className="map-error-content">
                <span className="map-error-icon">⚠️</span>
                <div>
                  <p className="map-error-title">ルート探索に失敗しました</p>
                  <p className="map-error-msg">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadRoute}
                className="map-retry-btn"
              >
                再試行
              </button>
            </div>
          )}

          {/* ③ ルート取得完了時の案内カード */}
          {!isLoading && !errorMessage && selectedSpot && (
            <div className="map-glass-card map-info-card">
              {/* カードヘッダー */}
              <div className="map-card-header">
                <div className="map-card-header-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-base">
                    🎯
                  </span>
                  <div>
                    <h3 className="map-spot-title">
                      {selectedSpot.name}
                    </h3>
                    {targetParking && (
                      <p className="map-spot-parking-sub">
                        🅿️ 案内先: {targetParking.name}
                      </p>
                    )}
                  </div>
                </div>

                {onClearSpot && (
                  <button
                    type="button"
                    onClick={onClearSpot}
                    className="map-close-btn"
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
                    <span className="map-tag-chip">
                      💴 {targetParking.price}
                    </span>
                  )}
                  {targetParking.capacity && (
                    <span className="map-tag-chip">
                      🚗 {targetParking.capacity}台
                    </span>
                  )}
                  {targetParking.url && (
                    <a
                      href={targetParking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-tag-chip link"
                    >
                      詳細 ↗
                    </a>
                  )}
                </div>
              )}

              {/* 長崎ローカルおせっかいアドバイス */}
              {selectedSpot.osekkai_message && (
                <div className="map-osekkai-box">
                  💡 {selectedSpot.osekkai_message}
                </div>
              )}

              {/* フッター: ルート情報 */}
              <div className="map-card-footer">
                <span className="map-footer-status">
                  <span>🛣️</span> {routeMessage || "大通り優先ルートを案内中"}
                </span>
                <span className="map-footer-note">初心者安心</span>
              </div>
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={startPosition}
        zoom={13}
        zoomControl={false}
        className="map-container-root"
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
              <div className="map-popup-card">
                <strong className="map-popup-title blue">
                  📍 出発地 {isCustomStart ? "（現在地）" : "（長崎駅）"}
                </strong>
                <p className="map-popup-meta">
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
              <div className="map-popup-card wide">
                <div className="map-popup-badge-dest">
                  🏁 目的地駐車場
                </div>
                <strong className="map-popup-title large red">
                  {targetParking.name}
                </strong>
                {selectedSpot && (
                  <p
                    className="map-popup-highlight"
                  >
                    🎯 「{selectedSpot.name}」におすすめの駐車場です
                  </p>
                )}
                {targetParking.price && (
                  <p
                    className="map-popup-desc map-popup-subtle"
                  >
                    料金: {targetParking.price}
                  </p>
                )}
                {targetParking.capacity && (
                  <p
                    className="map-popup-meta map-popup-subtle"
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
              <div className="map-popup-card">
                <strong className="map-popup-title warning">
                  ⚠️ {spot.name}
                </strong>
                <p className="map-popup-desc">
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
                <div className="map-popup-card">
                  <strong className="map-popup-title blue">
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
                      className="map-popup-meta"
                    >
                      料金: {p.price}
                    </p>
                  )}
                  {p.capacity && (
                    <p
                      className="map-popup-meta"
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
                <div className="map-popup-card wide">
                  <strong className="map-popup-title large primary">
                    {isSelected ? `⭐ ${spot.name}（選択中）` : spot.name}
                  </strong>

                  <p
                    className="map-popup-desc"
                  >
                    {spot.description}
                  </p>

                  {spot.osekkai_message && (
                    <p
                      className="map-popup-banner map-popup-banner-amber"
                    >
                      💡 {spot.osekkai_message}
                    </p>
                  )}

                  {/* 紐づく駐車場の事前案内 */}
                  {associatedParking && (
                    <div
                      className="map-popup-banner map-popup-banner-blue"
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
                    className={`map-popup-action-btn ${
                      isSelected ? "selected" : "unselected"
                    }`}
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
