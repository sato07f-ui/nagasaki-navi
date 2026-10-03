"use client";
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet"; // ← これを追加
import intersections from "../data/intersection.json";
import { fetchRoute, LatLngTuple } from "../utils/RouteService";
// spot.jsonから観光地データを追加
import spotsData from "../data/spot.json";

// Next.jsでLeafletのデフォルトマーカー画像が表示されない問題を解決
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl; // エラー回避のために修正
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const dangerIcon = L.icon({
  iconUrl: "/danger_icon.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// 長崎駅付近の座標
const startPosition: LatLngTuple = [32.752405, 129.871058];
// 【Test】終着点を眼鏡橋に設定
const goalPosition: LatLngTuple = [32.74718, 129.880092];

const MapComponent = () => {
  const [routePositions, setRoutePositions] = useState<LatLngTuple[]>([]);

  {
    /* ルート取得中のUI状態管理（ローディング・エラー・案内メッセージ） */
  }
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);

  // 初回マウント時にルートを取得（クリーンアップ付き非同期処理）
  useEffect(() => {
    let ignore = false;

    async function loadInitialRoute() {
      const result = await fetchRoute(startPosition, goalPosition);
      if (ignore) return;

      if (result.error) {
        setErrorMessage(result.error);
        setRoutePositions([]);
        setRouteMessage(null);
      } else {
        setRoutePositions(result.coordinates);
        setRouteMessage(result.message || null);
      }

      setIsLoading(false);
    }

    loadInitialRoute();

    return () => {
      ignore = true;
    };
  }, []);

  // エラー発生時の再試行ボタン用ハンドラー
  const handleRetry = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchRoute(startPosition, goalPosition);

    if (result.error) {
      setErrorMessage(result.error);
      setRoutePositions([]);
      setRouteMessage(null);
    } else {
      setRoutePositions(result.coordinates);
      setRouteMessage(result.message || null);
    }

    setIsLoading(false);
  };

  return (
    <div className="relative h-screen w-full">
      {/* ルート探索状態のオーバーレイUI（ローディング・エラー通知・情報バナー */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md pointer-events-auto">
        {/* ① ローディング表示 */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-blue-100 text-blue-800">
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
            <div className="text-sm font-medium">
              初心者向け大通りルートを探索中...
            </div>
          </div>
        )}

        {/* ② エラー時の警告表示 & 再試行ボタン */}
        {!isLoading && errorMessage && (
          <div className="flex items-start justify-between gap-3 bg-red-50/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-red-200 text-red-800">
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">⚠️</span>
              <div>
                <p className="text-sm font-bold">ルート探索に失敗しました</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
            >
              再試行
            </button>
          </div>
        )}

        {/* ③ ルート取得完了時の案内表示 */}
        {!isLoading && !errorMessage && routeMessage && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-md border border-slate-200 text-slate-700 text-xs">
            <span className="text-sm">🛣️</span>
            <span>{routeMessage}</span>
          </div>
        )}
      </div>

      <MapContainer
        center={startPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 国土地理院の淡色地図を使用（APIキー不要！） */}
        <TileLayer
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
        />
        <Marker position={startPosition}>
          <Popup>長崎駅！ここからスタート！</Popup>
        </Marker>

        {/* ゴール地点のピン */}
        <Marker position={goalPosition}>
          <Popup>眼鏡橋（目的地）</Popup>
        </Marker>

        {/* APIから座標データが取得できたら道路沿いのルートを描画*/}
        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* JSONの交差点データをループしてビックリマークを描画 */}
        {intersections.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={dangerIcon}
          >
            <Popup>
              <div style={{ minWidth: "150px" }}>
                <strong style={{ color: "#d97706", fontSize: "14px" }}>
                  {spot.name}
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
        {/* 観光地（spot.json）のピンを描画 */}
        {spotsData.map((spot) => (
          <Marker key={`spot-${spot.id}`} position={[spot.lat, spot.lng]}>
            <Popup>
              <div style={{ minWidth: "160px" }}>
                <strong style={{ color: "#1d4ed8", fontSize: "14px" }}>
                  {spot.name}
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
                {spot.osekkai_message && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "11px",
                      color: "#b45309",
                      backgroundColor: "#fef3c7",
                      padding: "4px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    💡 {spot.osekkai_message}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
