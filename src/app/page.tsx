"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-slate-100" />,
});

export default function Home() {
  return (
    <main className="h-screen w-full">
      <Map />
    </main>
  );
}
