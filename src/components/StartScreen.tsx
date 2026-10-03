"use client";

import Link from "next/link";
import { useState } from "react";
import { Caveat , Zen_Maru_Gothic } from "next/font/google";

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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-slate-700 shadow-md"
            aria-label="メニュー"
          >
            ☰
          </button>

          <button className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-white/60 active:scale-95">
  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-xs font-bold text-white">
    P
  </span>

  駐車場を探す
</button>
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

  <option value="中華街">中華街</option>
  <option value="グラバー園">グラバー園</option>
  <option value="出島">出島</option>
  <option value="眼鏡橋">眼鏡橋</option>
  <option value="稲佐山">稲佐山</option>
  <option value="大浦天主堂">大浦天主堂</option>
  <option value="平和公園">平和公園</option>
  <option value="長崎駅周辺の商業施設">
    長崎駅周辺の商業施設
  </option>
  <option value="原爆資料館">原爆資料館</option>
  <option value="浦上天主堂">浦上天主堂</option>
  <option value="浜町アーケード">浜町アーケード</option>
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

    {/* テストコース */}
    <button className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
        <svg
  viewBox="0 0 24 24"
  className="h-7 w-7 text-pink-500"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  {/* 車体 */}
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

  {/* ライト */}
  <circle cx="7" cy="13.5" r="1" fill="currentColor" />
  <circle cx="17" cy="13.5" r="1" fill="currentColor" />

  {/* タイヤ */}
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
    </button>

    {/* 駐車場 */}
    <button className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
          P
        </div>
      </div>

      <span className="mt-2 text-xs font-medium text-slate-600">
        駐車場
      </span>
    </button>

    {/* スタンプ */}
    <button className="flex flex-col items-center rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50 active:scale-95">
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
    </main>
  );
}