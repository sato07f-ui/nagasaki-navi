import { NextResponse } from "next/server";

export type LatLngTuple = [number, number];

/**
 * 指定したプロファイル（driving-hgv または driving-car）でOpenRouteServiceからルートを取得する内部関数
 */
async function fetchRouteWithProfile(
  start: LatLngTuple,
  end: LatLngTuple,
  profile: "driving-hgv" | "driving-car",
  apiKey: string
): Promise<LatLngTuple[] | null> {
  try {
    // OpenRouteService のパラメータ: start=lng,lat&end=lng,lat
    const startParam = `${start[1]},${start[0]}`;
    const endParam = `${end[1]},${end[0]}`;

    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${startParam}&end=${endParam}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Route API] ${profile} ルートが見つかりませんでした (Status: ${res.status})`);
      return null;
    }

    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    // GeoJSON [lng, lat] を Leaflet用の [lat, lng] に変換
    const coordinates: [number, number][] = data.features[0].geometry.coordinates;
    return coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.warn(`[Route API] ${profile} 通信エラー:`, error);
    return null;
  }
}

/**
 * POST /api/route
 * Body: { start: [lat, lng], end: [lat, lng] }
 */
export async function POST(request: Request) {
  try {
    // APIキーをサーバーサイド環境変数から安全に取得
    const apiKey = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouteService APIキーが設定されていません (.env.local を確認してください)" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { start, end } = body as { start: LatLngTuple; end: LatLngTuple };

    if (!start || !end || start.length !== 2 || end.length !== 2) {
      return NextResponse.json(
        { error: "無効な座標が指定されました。" },
        { status: 400 }
      );
    }

    // ① 初心者向けに大通り優先（driving-hgv）で検索
    const hgvRoute = await fetchRouteWithProfile(start, end, "driving-hgv", apiKey);
    if (hgvRoute && hgvRoute.length > 0) {
      return NextResponse.json({
        coordinates: hgvRoute,
        profile: "driving-hgv",
        message: "大通りルート（大型車通行可能）を取得しました",
      });
    }

    // ② 細い路地等で大型車ルートが見つからなかった場合、通常モード（driving-car）で再試行
    const carRoute = await fetchRouteWithProfile(start, end, "driving-car", apiKey);
    if (carRoute && carRoute.length > 0) {
      return NextResponse.json({
        coordinates: carRoute,
        profile: "driving-car",
        message: "通常ルートを取得しました",
      });
    }

    return NextResponse.json(
      { error: "すべてのプロファイルでルートが見つかりませんでした。" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[Route API Error]:", error);
    return NextResponse.json(
      { error: "ルート探索中にサーバー内部エラーが発生しました。" },
      { status: 500 }
    );
  }
}
