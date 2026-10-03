"use client";

import Link from "next/link";
import { useState } from "react";
import { Caveat , Zen_Maru_Gothic } from "next/font/google";
import spots from "../data/spot.json";
import parkings from "../data/parking.json";

const caveat = Caveat({ 
    subsets: ["latin"], 
});
const zenMaruGothic = Zen_Maru_Gothic({
    subsets: ["latin"],
    weight: "500",
});


export default function StartScreen() {
const [location, setLocation] = useState("現在地を取得");
const [destination, setDestination] = useState("");
const[latitude, setLatitude] = useState<number | null>(null);
const[longitude, setLongitude] = useState<number | null>(null);
const[showSpots, setShowSpots] = useState(false);
const [showStamps, setShowStamps] = useState(false);
const [showParkings, setShowParkings] = useState(false);
const [showMenu, setShowMenu] = useState(false);
const [collectedStamps, setCollectedStamps] = useState<string[]>([
  "chinatown",
]);

const getDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371000; // 地球の半径（m）

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
    setLocation("GPSを利用できません");
    return;
  }

  setLocation("現在地を取得中...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setLatitude(latitude);
      setLongitude(longitude);

      // 現在地から58m以内の観光地を探す
const nearbySpots = spots.filter((spot) => {
  const distance = getDistance(
    latitude,
    longitude,
    spot.lat,
    spot.lng
  );

  return distance <= 50;
});

// 58m以内の観光地があればスタンプを獲得
if (nearbySpots.length > 0) {
  setCollectedStamps((prev) => {
    const newStamps = nearbySpots.map((spot) => spot.id);

    return [...new Set([...prev, ...newStamps])];
  });
}

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja`
        );

        const data = await response.json();

        if (data.display_name) {
          setLocation(data.display_name);
        } else {
          setLocation("現在地を取得しました");
        }
      } catch {
        setLocation("住所を取得できませんでした");
      }
    },
    () => {
      setLocation("現在地を取得できませんでした");
    }
  );
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
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-slate-700 shadow-md"
            aria-label="メニュー"
          >
            ☰
          </button>

          <Link
  href="/?mode=parking"
  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm font-semibold text-blue-600 shadow-md backdrop-blur-md transition hover:bg-white/75 active:scale-95"
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
        <div className="mt-8 rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl">

          {/* 出発地・目的地 */}
<div className="relative">

  {/* 左側のルート線 */}
  <div className="absolute left-[9px] top-[29px] h-[82px] border-l-2 border-dotted border-slate-300" />

  {/* 出発地 */}
  <div className="relative flex gap-3">
    {/* 青い丸 */}
    <div className="mt-[6px] h-[18px] w-[18px] shrink-0 rounded-full border-[5px] border-blue-500 bg-white" />

    <div className="w-full">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        出発地
      </label>

      <button
  type="button"
  onClick={getCurrentLocation}
  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/50 px-4 py-4 text-left text-sm text-slate-700 outline-none transition hover:bg-white/70"
>
  <span>{location}</span>

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
</button>
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
  onChange={(e) => setDestination(e.target.value)}
  className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white/70"
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

          {/* ルート検索 */}
<Link
  href="/"
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
</Link>

          {/* 区切り */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">または</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* 地図から探す */}
<Link
  href="/"
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

    {/* 観光地 */}
    <button 
    onClick={() => setShowSpots(true)}
    className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
        <svg
  viewBox="0 0 24 24"
  className="h-7 w-7 text-pink-500"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M8 4H16L15 9L18 12H6L9 9L8 4Z"
    fill="currentColor"
  />
  <path
    d="M12 12V20"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  />
</svg>
      </div>

      <span className="mt-2 text-xs font-medium text-slate-600">
        観光地
      </span>
    </button>

    {/* 駐車場 */}
    <button 
    onClick={() => setShowParkings(true)}
    className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
          P
        </div>
      </div>

      <span className="mt-2 text-xs font-medium text-slate-600">
        駐車場一覧
      </span>
    </button>

    {/* スタンプ */}
    <button 
    onClick={() => setShowStamps(true)}
    className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
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
    </button>

  </div>
</div>

      </div>
    {/* 観光地一覧モーダル */}
{showSpots && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
    <div className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/40 bg-white/80 p-5 shadow-2xl backdrop-blur-md">

      {/* タイトル */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          観光地一覧
        </h2>

        <button
          type="button"
          onClick={() => setShowSpots(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-xl text-slate-600"
        >
          ×
        </button>
      </div>

      {/* 観光地 */}
      <div className="space-y-3">
        {spots.map((spot) => (
          <div
            key={spot.id}
            className="rounded-2xl bg-white/70 p-4"
          >
            <div className="flex gap-3">
              <span className="text-pink-500">📌</span>

              <div>
                <h3 className="font-bold text-slate-800">
                  {spot.name}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {spot.description}
                </p>
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
    <div className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/40 bg-white/85 p-5 shadow-2xl backdrop-blur-md">

      {/* タイトル */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            長崎スタンプ帳
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            観光地を巡ってスタンプを集めよう！
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowStamps(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-xl text-slate-600"
        >
          ×
        </button>
      </div>

      {/* 獲得数 */}
      <div className="my-5 text-center">
        <span className="text-2xl font-bold text-emerald-500">
          {collectedStamps.length}
        </span>
        <span className="text-sm font-semibold text-slate-500">
          {" "} / {spots.length} GET!
        </span>
      </div>

      {/* スタンプ一覧 */}
      <div className="grid grid-cols-2 gap-3">
        {spots.map((spot) => (
          <div
            key={spot.id}
            className="flex flex-col items-center rounded-2xl bg-white/70 p-4"
          >
            {collectedStamps.includes(spot.id) ? (
  /* 獲得済み */
  <div className="flex h-20 w-20 rotate-[-8deg] items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-50">
    <div className="text-center text-emerald-500">
      <div className="text-2xl font-black">✓</div>
      <div className="text-[10px] font-bold">GET!</div>
    </div>
  </div>
) : (
  /* 未獲得 */
  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-slate-300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="6"
        y="10"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>
)}

            <p className="mt-3 text-center text-sm font-bold text-slate-700">
              {spot.name}
            </p>

            <p
  className={`mt-1 text-xs ${
    collectedStamps.includes(spot.id)
      ? "font-bold text-emerald-500"
      : "text-slate-400"
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
    <div className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/40 bg-white/85 p-5 shadow-2xl backdrop-blur-md">

      {/* タイトル */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            駐車場一覧
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            長崎市内の駐車場情報
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowParkings(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-xl text-slate-600"
        >
          ×
        </button>
      </div>

      {/* 駐車場一覧 */}
      <div className="space-y-3">
        {parkings.map((parking) => (
          <div
            key={parking.id}
            className="rounded-2xl bg-white/70 p-4"
          >
            <div className="flex items-start gap-3">

              {/* Pアイコン */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-bold text-blue-600">
                P
              </div>

              <div className="w-full">
                <h3 className="font-bold text-slate-800">
                  {parking.name}
                </h3>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>💴 {parking.price}</p>
                  <p>🚗 {parking.capacity}台</p>
                  <p>🕐 {parking.twentyfour_h}</p>
                  <p>🏢 立体駐車場：{parking.three_dim}</p>
                </div>

                <a
                  href={parking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-blue-500 hover:text-blue-600"
                >
                  詳細を見る →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>
)}
{/* サイドメニュー */}
{showMenu && (
  <div className="fixed inset-0 z-50 bg-black/30">

    {/* メニュー本体 */}
    <div className="h-full w-[80%] max-w-xs bg-white/90 p-6 shadow-2xl backdrop-blur-xl">

      {/* 上部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className={`${caveat.className} text-3xl text-blue-600`}>
            Nagasaki Navi
          </p>
          <p className="mt-1 text-xs text-slate-400">
            MENU
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMenu(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600"
        >
          ×
        </button>
      </div>

      {/* メニュー項目 */}
      <div className="space-y-2">

        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-4 py-4 font-semibold text-slate-700 transition hover:bg-blue-50"
        >
          <span>🗺️</span>
          地図を見る
        </Link>

        <button
          type="button"
          onClick={() => {
            setShowMenu(false);
            setShowSpots(true);
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 font-semibold text-slate-700 transition hover:bg-pink-50"
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
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 font-semibold text-slate-700 transition hover:bg-sky-50"
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
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 font-semibold text-slate-700 transition hover:bg-emerald-50"
        >
          <span>🏷️</span>
          スタンプ帳
        </button>

      </div>
    </div>
  </div>
)}
    </main>
    
  );
}