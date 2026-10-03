"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Caveat, Zen_Maru_Gothic } from "next/font/google";
import spotsData from "../data/spot.json";

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

  // 地図画面へ遷移するURL（現在地があればパラメータに付与）
  const mapUrl =
    latitude !== null && longitude !== null
      ? `/?startLat=${latitude}&startLng=${longitude}`
      : "/";

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

    router.push(`/?startLat=${startLat}&startLng=${startLng}&spotId=${destination}`);
  };

  return (
    <main
      className="min-h-screen bg-cover bg-[center_10%] bg-no-repeat"
      style={{
        backgroundImage: "url('/start_haikei.jpg')",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5">

        {/* 上部 */}
        <div className="flex items-center justify-between">
          <Link
            href={mapUrl}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-slate-700 shadow-md transition hover:bg-slate-50"
            aria-label="地図へ"
          >
            🗺️
          </Link>

          <Link
            href={mapUrl}
            className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-white/80 active:scale-95"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-xs font-bold text-white">
              P
            </span>
            駐車場を探す
          </Link>
        </div>

        {/* タイトル */}
        <div className="mt-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-sm">
            <svg
              viewBox="0 0 64 64"
              className="h-11 w-11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 帆 */}
              <path
                d="M31 10V36H14L31 10Z"
                fill="#60A5FA"
              />
              <path
                d="M34 16V36H49L34 16Z"
                fill="#2563EB"
              />

              {/* 船 */}
              <path
                d="M12 38H52L47 47H18L12 38Z"
                fill="#1D4ED8"
              />

              {/* 波 */}
              <path
                d="M10 51C15 47 20 55 25 51C30 47 35 55 40 51C45 47 50 55 55 51"
                stroke="#38BDF8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className={`${caveat.className} text-5xl font-semibold text-blue-700`}>
            Nagasaki Navi
          </h1>

          <p className={`${zenMaruGothic.className} mt-3 text-sm font-medium text-amber-950/80`}>
            長崎を、もっと自由に、もっと快適に。
          </p>
        </div>

        {/* 検索カード */}
        <div className="mt-8 rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl backdrop-blur-sm">

          {/* 出発地・目的地 */}
          <div className="relative">

            {/* 左側のルート線 */}
            <div className="absolute left-[9px] top-[29px] h-[82px] border-l-2 border-dotted border-slate-300" />

            {/* 出発地 */}
            <div className="relative flex gap-3">
              {/* 青い丸 */}
              <div className="mt-[6px] h-[18px] w-[18px] shrink-0 rounded-full border-[5px] border-blue-500 bg-white shadow-sm" />

              <div className="w-full">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    出発地
                  </label>
                  {latitude !== null && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      設定済み
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 text-left text-sm text-slate-700 outline-none transition hover:bg-white/90 active:scale-[0.99]"
                >
                  <span className="truncate font-medium">
                    {location}
                  </span>

                  {isLocating ? (
                    <svg
                      className="h-5 w-5 animate-spin text-blue-500 shrink-0"
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
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0 text-blue-500"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 2V5M12 19V22M2 12H5M19 12H22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
                {latitude === null && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    ※タップで現在地を取得（未取得の場合は長崎駅が出発地になります）
                  </p>
                )}
              </div>
            </div>

            {/* 間隔 */}
            <div className="h-5" />

            {/* 目的地 */}
            <div className="relative flex gap-3">
              {/* 赤いピン */}
              <div className="mt-[4px] flex h-[20px] w-[18px] shrink-0 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
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
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  目的地
                </label>

                <select
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  <option value="" disabled>
                    目的地を選択
                  </option>
                  {spotsData.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* エラーメッセージ表示 */}
          {errorMsg && (
            <div className="mt-3 rounded-xl bg-red-100/90 px-3 py-2 text-xs font-semibold text-red-700">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* ルート検索ボタン */}
          <button
            type="button"
            onClick={handleSearchRoute}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4 font-bold text-white shadow-md transition hover:bg-blue-600 active:scale-[0.98]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
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
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">または</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* 地図から探す */}
          <Link
            href={mapUrl}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-white py-4 font-semibold text-blue-600 transition hover:bg-blue-50 active:scale-[0.98]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
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

        {/* 下部メニュー */}
        <div className="mt-auto pt-6">
          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/40 bg-white/50 p-3 shadow-lg backdrop-blur-md">

            {/* テストコース */}
            <Link
              href={mapUrl}
              className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-pink-500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 11L7 7.5C7.4 6.6 8.2 6 9.2 6H14.8C15.8 6 16.6 6.6 17 7.5L19 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="7"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="7" cy="13.5" r="1" fill="currentColor" />
                  <circle cx="17" cy="13.5" r="1" fill="currentColor" />
                  <path
                    d="M7 17V19M17 17V19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="mt-2 text-xs font-medium text-slate-600">
                テストコース
              </span>
            </Link>

            {/* 駐車場 */}
            <Link
              href={mapUrl}
              className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
                  P
                </div>
              </div>
              <span className="mt-2 text-xs font-medium text-slate-600">
                駐車場
              </span>
            </Link>

            {/* スタンプ */}
            <Link
              href={mapUrl}
              className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-emerald-500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 14C8 12 9 11 10 10V7C10 5.9 10.9 5 12 5C13.1 5 14 5.9 14 7V10C15 11 16 12 16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 14H18V18H6V14Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 21H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="mt-2 text-xs font-medium text-slate-600">
                スタンプ
              </span>
            </Link>

          </div>
        </div>

      </div>
    </main>
  );
}