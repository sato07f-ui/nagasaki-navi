"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const Map = dynamic(() => import("../MapComponent"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-slate-100" />,
});

export default function Home() {
  const [showParking, setShowParking] = useState(false);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <Map />
      {/* 上部UI */}
      <div className="absolute left-0 top-0 z-[9999] flex w-full items-start gap-2 p-4">
        {/* メニューボタン */}
        <button
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-md"
          aria-label="メニュー"
        >
          ☰
        </button>
        {/* カテゴリボタン */}
        <div className="flex gap-2 overflow-x-auto">
          <button className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md">
            テストコース
          </button>
          <button className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md">
            おすすめ
          </button>
          <button className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md">
            スタンプ
          </button>
        </div>
      </div>
    </main>
  );
}
