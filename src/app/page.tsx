"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import spotsData from "../data/spot.json";
import parkingData from "../data/parking.json";
import { getParkingForSpot } from "../utils/parkingService";
import type { MapComponentProps } from "./MapComponent";

const Map = dynamic<MapComponentProps>(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 text-slate-600 font-medium">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
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
        <span>地図を読み込み中...</span>
      </div>
    </div>
  ),
});

// おすすめ観光地（厳選5スポット）
const RECOMMENDED_SPOT_IDS = ["chinatown", "glover", "dejima", "meganebashi", "peace_park"];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const startLatParam = searchParams.get("startLat");
  const startLngParam = searchParams.get("startLng");
  const initialSpotId = searchParams.get("spotId") || undefined;

  const startLat = startLatParam ? parseFloat(startLatParam) : undefined;
  const startLng = startLngParam ? parseFloat(startLngParam) : undefined;

  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>(initialSpotId);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // モーダル・ドロワーの状態管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [isRecommendedOpen, setIsRecommendedOpen] = useState(false);
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);

  const [prevInitialSpotId, setPrevInitialSpotId] = useState(initialSpotId);
  if (initialSpotId !== prevInitialSpotId) {
    setPrevInitialSpotId(initialSpotId);
    setSelectedSpotId(initialSpotId);
    if (initialSpotId === "meganebashi") {
      setActiveCategory("test-course");
    }
  }

  // 目的地を設定
  const handleSelectSpot = (spotId: string) => {
    setSelectedSpotId(spotId);
    const params = new URLSearchParams();
    if (startLat !== undefined && startLng !== undefined) {
      params.set("startLat", startLat.toString());
      params.set("startLng", startLng.toString());
    }
    params.set("spotId", spotId);
    router.replace(`/?${params.toString()}`);

    // モーダル類を閉じる
    setIsRecommendedOpen(false);
    setIsStampModalOpen(false);
    setIsParkingModalOpen(false);
    setIsMenuOpen(false);
  };

  // 目的地をクリア（観光地ピンのみの初期状態に戻す）
  const handleClearSpot = () => {
    setSelectedSpotId(undefined);
    setActiveCategory(null);
    if (startLat !== undefined && startLng !== undefined) {
      router.replace(`/?startLat=${startLat}&startLng=${startLng}`);
    } else {
      router.replace("/");
    }
  };

  // ① 「テストコース」ボタン
  const handleTestCourseClick = () => {
    if (selectedSpotId === "meganebashi" && activeCategory === "test-course") {
      handleClearSpot();
    } else {
      setActiveCategory("test-course");
      handleSelectSpot("meganebashi"); // テストコース: 長崎駅→眼鏡橋
    }
  };

  // ② 「おすすめ」ボタン
  const handleRecommendedClick = () => {
    setIsRecommendedOpen((prev) => !prev);
    setIsStampModalOpen(false);
    setIsParkingModalOpen(false);
    setActiveCategory((prev) => (prev === "recommended" ? null : "recommended"));
  };

  // ③ 「スタンプ」ボタン
  const handleStampClick = () => {
    setIsStampModalOpen((prev) => !prev);
    setIsRecommendedOpen(false);
    setIsParkingModalOpen(false);
    setActiveCategory((prev) => (prev === "stamp" ? null : "stamp"));
  };

  // ④ 「駐車場」ボタン
  const handleParkingClick = () => {
    setIsParkingModalOpen((prev) => !prev);
    setIsRecommendedOpen(false);
    setIsStampModalOpen(false);
    setActiveCategory((prev) => (prev === "parking" ? null : "parking"));
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <Map
        startLat={startLat}
        startLng={startLng}
        spotId={selectedSpotId}
        onSelectSpot={handleSelectSpot}
        onClearSpot={handleClearSpot}
      />

      {/* 上部UI: メニューおよび横スクロールカテゴリボタン（スマホ最適化・画面被り解消） */}
      <div className="absolute left-0 top-0 z-[999] flex w-full flex-col gap-2 p-3 sm:p-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto w-full">
          {/* メニューボタン */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-md transition hover:bg-slate-50 active:scale-95 border border-slate-200/60"
            aria-label="メニュー"
          >
            ☰
          </button>

          {/* カテゴリボタン群（横スクロール） */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pr-2">
            {/* テストコース */}
            <button
              type="button"
              onClick={handleTestCourseClick}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition active:scale-95 border ${
                activeCategory === "test-course" && selectedSpotId === "meganebashi"
                  ? "bg-blue-600 text-white border-blue-600 font-bold"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              🚗 テストコース
            </button>

            {/* おすすめ */}
            <button
              type="button"
              onClick={handleRecommendedClick}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition active:scale-95 border ${
                isRecommendedOpen
                  ? "bg-amber-500 text-white border-amber-500 font-bold"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              ⭐ おすすめ
            </button>

            {/* スタンプ */}
            <button
              type="button"
              onClick={handleStampClick}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition active:scale-95 border ${
                isStampModalOpen
                  ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              💮 スタンプ
            </button>

            {/* 駐車場 */}
            <button
              type="button"
              onClick={handleParkingClick}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition active:scale-95 border ${
                isParkingModalOpen
                  ? "bg-sky-600 text-white border-sky-600 font-bold"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              🅿️ 駐車場
            </button>
          </div>
        </div>
      </div>

      {/* ① おすすめ観光地モーダル / ボトムシート */}
      {isRecommendedOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto"
          onClick={() => setIsRecommendedOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl border border-amber-200 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <span>⭐</span> 長崎のおすすめ観光地
              </h3>
              <button
                type="button"
                onClick={() => setIsRecommendedOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {spotsData
                .filter((s) => RECOMMENDED_SPOT_IDS.includes(s.id))
                .map((spot) => {
                  const parking = getParkingForSpot(spot.id);
                  const isSelected = selectedSpotId === spot.id;
                  return (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/70 transition"
                    >
                      <div className="text-left flex-1 pr-2">
                        <p className="text-sm font-bold text-slate-800">{spot.name}</p>
                        {parking && (
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">🅿️ {parking.name}</p>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{spot.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectSpot(spot.id);
                          setIsRecommendedOpen(false);
                        }}
                        className={`text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isSelected ? "設定中" : "ここへ行く"}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ② スタンプ帳モーダル */}
      {isStampModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto" onClick={() => setIsStampModalOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">
                  💮
                </span>
                <h3 className="font-bold text-slate-800">長崎観光スタンプ帳</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStampModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              目的地に設定して観光地を巡り、長崎スタンプを集めよう！
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {spotsData.map((spot) => {
                const isSelected = selectedSpotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => handleSelectSpot(spot.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-2xl mb-1">
                      {isSelected ? "💮" : "⚪"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 truncate w-full">
                      {spot.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t text-center">
              <button
                type="button"
                onClick={() => setIsStampModalOpen(false)}
                className="w-full rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ③ 駐車場一覧モーダル / ボトムシート */}
      {isParkingModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto"
          onClick={() => setIsParkingModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl border border-sky-200 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <span>🅿️</span> 市内駐車場一覧（{parkingData.length}箇所）
              </h3>
              <button
                type="button"
                onClick={() => setIsParkingModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {parkingData.map((parking) => (
                <div
                  key={parking.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/70 border border-sky-100"
                >
                  <div className="text-left flex-1 pr-2">
                    <p className="text-sm font-bold text-slate-800">{parking.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {parking.price || "料金情報あり"} / 収容 {parking.capacity || "-"}台
                    </p>
                    {parking.twentyfour_h && (
                      <p className="text-[11px] text-slate-400">{parking.twentyfour_h}</p>
                    )}
                  </div>
                  {parking.url && (
                    <a
                      href={parking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 underline font-semibold px-2 py-1 shrink-0"
                    >
                      詳細
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ④ 「☰」サイドメニュー・ドロワー */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[10000] flex bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="w-72 max-w-[80%] h-full bg-white shadow-2xl flex flex-col p-5">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-bold text-blue-700">Nagasaki Navi</h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {/* スタート画面へ戻る */}
              <Link
                href="/start"
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition"
              >
                <span>🚀</span>
                <span>出発地・目的地を検索</span>
              </Link>

              {/* テストコース */}
              <button
                type="button"
                onClick={() => {
                  handleTestCourseClick();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition text-left"
              >
                <span>🚗</span>
                <span>初心者ドライブコース（長崎駅→眼鏡橋）</span>
              </button>

              {/* おすすめ観光地 */}
              <button
                type="button"
                onClick={() => {
                  setIsRecommendedOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition text-left"
              >
                <span>⭐</span>
                <span>おすすめ観光地一覧</span>
              </button>

              {/* スタンプ */}
              <button
                type="button"
                onClick={() => {
                  setIsStampModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition text-left"
              >
                <span>💮</span>
                <span>長崎スタンプ帳</span>
              </button>

              {/* ルート解除 */}
              {selectedSpotId && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearSpot();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl text-red-600 font-medium text-sm hover:bg-red-50 transition text-left"
                >
                  <span>🔄</span>
                  <span>現在のルート案内を解除</span>
                </button>
              )}
            </div>

            <div className="mt-auto pt-4 border-t text-xs text-slate-400">
              長崎を、もっと自由に、もっと快適に。
            </div>
          </div>

          <div
            className="flex-1"
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-100 text-slate-500">
          読み込み中...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}