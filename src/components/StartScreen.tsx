"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Caveat, Zen_Maru_Gothic } from "next/font/google";
import spots from "../data/spot.json";
import parkings from "../data/parking.json";
import "./StartScreen.css";

const caveat = Caveat({ 
  subsets: ["latin"], 
});
const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: "500",
});

// 長崎駅のデフォルト座標（現在地未取得・取得失敗時のフォールバック）
const DEFAULT_START = {
  name: "長崎駅",
  lat: 32.752405,
  lng: 129.871058,
};

export default function StartScreen() {
  const router = useRouter();
  const [location, setLocation] = useState("現在地を取得");
  const [destination, setDestination] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // モーダル・メニュー状態
  const [showSpots, setShowSpots] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const [showParkings, setShowParkings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [collectedStamps, setCollectedStamps] = useState<string[]>([
    "chinatown",
  ]);

  // 地図画面へ遷移するURL
  const mapUrl =
    latitude !== null && longitude !== null
      ? `/map?startLat=${latitude}&startLng=${longitude}`
      : "/map";

  // 2点間の距離計算（m）
  const getDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation("GPS非対応のブラウザです（長崎駅を出発地に設定）");
      setLatitude(DEFAULT_START.lat);
      setLongitude(DEFAULT_START.lng);
      return;
    }

    setIsLocating(true);
    setLocation("現在地を取得中...");
    setErrorMsg(null);

    const onLocationSuccess = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);
      setIsLocating(false);

      const nearbySpots = spots.filter((spot) => {
        const distance = getDistance(lat, lng, spot.lat, spot.lng);
        return distance <= 50;
      });

      if (nearbySpots.length > 0) {
        setCollectedStamps((prev) => {
          const newStamps = nearbySpots.map((spot) => spot.id);
          return [...new Set([...prev, ...newStamps])];
        });
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja`
        );
        const data = await response.json();

        if (data.display_name) {
          const shortAddress =
            data.address?.road ||
            data.address?.suburb ||
            data.address?.city ||
            data.display_name.split(",")[0];
          setLocation(shortAddress || "現在地を取得しました");
        } else {
          setLocation("現在地を取得しました");
        }
      } catch {
        setLocation(`現在地 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    };

    const onLocationError = (error: GeolocationPositionError) => {
      setIsLocating(false);
      console.warn("位置情報の取得に失敗しました:", error.message);

      if (error.code === error.PERMISSION_DENIED) {
        setLocation("位置情報が未許可のため長崎駅を出発地に設定");
      } else {
        setLocation("位置情報未取得のため長崎駅を出発地に設定");
      }

      setLatitude(DEFAULT_START.lat);
      setLongitude(DEFAULT_START.lng);
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSearchRoute = () => {
    if (!destination) {
      setErrorMsg("目的地を選択してください");
      return;
    }

    const startLat = latitude ?? DEFAULT_START.lat;
    const startLng = longitude ?? DEFAULT_START.lng;

    router.push(`/map?startLat=${startLat}&startLng=${startLng}&spotId=${destination}`);
  };

  return (
    <main className="start-screen-main">
      <div className="start-container">
        {/* ヘッダー */}
        <div className="flex-between">
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="circle-btn size-11"
            aria-label="メニュー"
          >
            ☰
          </button>

          <button
            type="button"
            onClick={() => setShowParkings(true)}
            className="header-parking-btn"
          >
            <span className="badge-p">P</span>
            駐車場を探す
          </button>
        </div>

        {/* ヒーロータイトル */}
        <div className="flex-col-center mt-6">
          <div className="icon-circle hero">
            <svg
              viewBox="0 0 64 64"
              className="svg-icon size-11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M31 10V36H14L31 10Z" fill="#60A5FA" />
              <path d="M34 16V36H49L34 16Z" fill="#2563EB" />
              <path d="M12 38H52L47 47H18L12 38Z" fill="#1D4ED8" />
              <path
                d="M10 51C15 47 20 55 25 51C30 47 35 55 40 51C45 47 50 55 55 51"
                stroke="#38BDF8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className={`${caveat.className} hero-title`}>
            Nagasaki Navi
          </h1>

          <p className={`${zenMaruGothic.className} hero-subtitle`}>
            長崎を、もっと自由に、もっと快適に。
          </p>
        </div>

        {/* 検索カード */}
        <div className="glass-panel search-panel-padding">
          <div className="route-form">
            <div className="route-dotted-line" />

            {/* 出発地 */}
            <div className="point-row">
              <div className="point-circle-blue" />

              <div className="w-full">
                <label className="form-label">出発地</label>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="form-input-box clickable"
                >
                  <span className="truncate-text">{location}</span>

                  <svg
                    viewBox="0 0 24 24"
                    className={`svg-icon size-5 text-blue ${isLocating ? "animate-spin" : ""}`}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 2V5M12 19V22M2 12H5M19 12H22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="spacer-5" />

            {/* 目的地 */}
            <div className="point-row">
              <div className="point-pin-red">
                <svg
                  viewBox="0 0 24 24"
                  className="svg-icon size-5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C12 22 19 15.5 19 9.5C19 5.36 15.87 2 12 2C8.13 2 5 5.36 5 9.5C5 15.5 12 22 12 22Z"
                    fill="#EF4444"
                  />
                  <circle cx="12" cy="9" r="2.5" fill="white" />
                </svg>
              </div>

              <div className="w-full">
                <div className="flex-between mb-2">
                  <label className="form-label no-margin">目的地</label>
                  <button
                    type="button"
                    onClick={() => setShowSpots(true)}
                    className="choose-spot-link"
                  >
                    観光地から選ぶ ➔
                  </button>
                </div>

                <select
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="form-input-box"
                >
                  <option value="" disabled>
                    目的地を選択
                  </option>
                  {spots.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          {errorMsg && (
            <div className="error-banner">⚠️ {errorMsg}</div>
          )}

          {/* ルート検索ボタン */}
          <button
            type="button"
            onClick={handleSearchRoute}
            className="btn-primary mt-5"
          >
            <svg
              viewBox="0 0 24 24"
              className="svg-icon size-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            ルートを検索
          </button>

          {/* 区切り */}
          <div className="or-divider">
            <div className="or-divider-line" />
            <span className="or-divider-text">または</span>
            <div className="or-divider-line" />
          </div>

          {/* 地図から探す */}
          <Link href={mapUrl} className="btn-outline">
            <svg
              viewBox="0 0 24 24"
              className="svg-icon size-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L3 21V6L9 3M9 18L15 21M9 18V3M15 21L21 18V3L15 6M15 21V6M15 6L9 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            地図から探す
          </Link>
        </div>

        {/* ボトムナビゲーション */}
        <div className="bottom-nav-wrapper">
          <div className="glass-panel bottom-nav-grid">
            {/* 観光地 */}
            <button
              type="button"
              onClick={() => setShowSpots(true)}
              className="bottom-nav-card"
            >
              <div className="icon-circle pink">
                <svg
                  viewBox="0 0 24 24"
                  className="svg-icon size-7 text-pink"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 4H16L15 9L18 12H6L9 9L8 4Z" fill="currentColor" />
                  <path d="M12 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="bottom-nav-label">観光地</span>
            </button>

            {/* 駐車場 */}
            <button
              type="button"
              onClick={() => setShowParkings(true)}
              className="bottom-nav-card"
            >
              <div className="icon-circle sky">
                <div className="badge-p">P</div>
              </div>
              <span className="bottom-nav-label">駐車場一覧</span>
            </button>

            {/* スタンプ */}
            <button
              type="button"
              onClick={() => setShowStamps(true)}
              className="bottom-nav-card"
            >
              <div className="icon-circle emerald">
                <svg
                  viewBox="0 0 24 24"
                  className="svg-icon size-6 text-emerald"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 14C8 12 9 11 10 10V7C10 5.9 10.9 5 12 5C13.1 5 14 5.9 14 7V10C15 11 16 12 16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="M6 14H18V18H6V14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="bottom-nav-label">スタンプ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 観光地一覧モーダル */}
      {showSpots && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="flex-between mb-5">
              <h2 className="modal-title">観光地一覧</h2>
              <button
                type="button"
                onClick={() => setShowSpots(false)}
                className="circle-btn size-9"
              >
                ×
              </button>
            </div>

            <div>
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  className="list-item-card clickable"
                  onClick={() => {
                    setDestination(spot.id);
                    setShowSpots(false);
                    if (errorMsg) setErrorMsg(null);
                  }}
                >
                  <div className="flex-row-gap">
                    <span className="text-pink">📌</span>
                    <div className="flex-1">
                      <div className="flex-between">
                        <h3 className="spot-name-header">{spot.name}</h3>
                        <span className="spot-select-text">選択 ➔</span>
                      </div>
                      <p className="spot-desc">{spot.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* スタンプ帳モーダル */}
      {showStamps && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="flex-between mb-2">
              <div>
                <h2 className="modal-title">長崎スタンプ帳</h2>
                <p className="modal-subtitle">観光地を巡ってスタンプを集めよう！</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStamps(false)}
                className="circle-btn size-9"
              >
                ×
              </button>
            </div>

            <div className="my-5 text-center">
              <span className="font-xl text-emerald">
                {collectedStamps.length}
              </span>
              <span className="font-sm text-muted">
                {" "} / {spots.length} GET!
              </span>
            </div>

            <div className="stamp-grid">
              {spots.map((spot) => (
                <div key={spot.id} className="list-item-card flex-col-center">
                  {collectedStamps.includes(spot.id) ? (
                    <div className="stamp-seal got">
                      <div>
                        <div className="stamp-check">✓</div>
                        <div className="stamp-label">GET!</div>
                      </div>
                    </div>
                  ) : (
                    <div className="stamp-seal empty">
                      <svg
                        viewBox="0 0 24 24"
                        className="svg-icon size-7 text-dim"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  <p className="stamp-spot-title">{spot.name}</p>

                  <p
                    className={`stamp-status ${
                      collectedStamps.includes(spot.id)
                        ? "text-emerald font-bold"
                        : "text-dim"
                    }`}
                  >
                    {collectedStamps.includes(spot.id) ? "獲得済み" : "未獲得"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 駐車場一覧モーダル */}
      {showParkings && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="flex-between mb-5">
              <div>
                <h2 className="modal-title">駐車場一覧</h2>
                <p className="modal-subtitle">長崎市内の駐車場情報</p>
              </div>
              <button
                type="button"
                onClick={() => setShowParkings(false)}
                className="circle-btn size-9"
              >
                ×
              </button>
            </div>

            <div>
              {parkings.map((parking) => (
                <div key={parking.id} className="list-item-card">
                  <div className="flex-start-gap">
                    <div className="badge-p large">P</div>

                    <div className="w-full">
                      <h3 className="spot-name-header">{parking.name}</h3>

                      <div className="parking-meta-text">
                        <p>💴 {parking.price}</p>
                        <p>🚗 {parking.capacity}台</p>
                        {parking.twentyfour_h && <p>🕐 {parking.twentyfour_h}</p>}
                        {parking.three_dim && <p>🏢 立体駐車場：{parking.three_dim}</p>}
                      </div>

                      {parking.url && (
                        <a
                          href={parking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="parking-detail-link"
                        >
                          詳細を見る →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* サイドドロワーメニュー */}
      {showMenu && (
        <div className="drawer-backdrop">
          <div className="drawer-panel">
            <div className="flex-between mb-8">
              <div>
                <p className={`${caveat.className} drawer-title`}>
                  Nagasaki Navi
                </p>
                <p className="mt-1 font-xs text-dim">MENU</p>
              </div>

              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="circle-btn size-9"
              >
                ×
              </button>
            </div>

            <div className="drawer-menu-list">
              <Link href={mapUrl} className="drawer-link">
                <span>🗺️</span>
                地図を見る
              </Link>

              <Link
                href="/map?startLat=32.752405&startLng=129.871058&spotId=meganebashi"
                className="drawer-link"
              >
                <span>🚗</span>
                初心者ドライブコース（長崎駅→眼鏡橋）
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowSpots(true);
                }}
                className="drawer-link"
              >
                <span>📌</span>
                観光地一覧
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowParkings(true);
                }}
                className="drawer-link"
              >
                <span>🅿️</span>
                駐車場一覧
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowStamps(true);
                }}
                className="drawer-link"
              >
                <span>🏷️</span>
                スタンプ帳
              </button>
            </div>

            <div className="drawer-footer">
              長崎を、もっと自由に、もっと快適に。
            </div>
          </div>

          <div
            className="drawer-scrim"
            onClick={() => setShowMenu(false)}
          />
        </div>
      )}
    </main>
  );
}
