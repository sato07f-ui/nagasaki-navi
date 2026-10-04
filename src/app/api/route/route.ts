import { NextResponse } from "next/server";

export type LatLngTuple = [number, number];

/**
 * タイムアウト付き fetch ヘルパー
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 指定したプロファイルで OpenRouteService からルートを取得
 */
async function fetchRouteWithProfile(
  start: LatLngTuple,
  end: LatLngTuple,
  profile: "driving-hgv" | "driving-car" | "foot-walking",
  apiKey: string
): Promise<LatLngTuple[] | null> {
  if (!apiKey) return null;
  try {
    const startParam = `${start[1]},${start[0]}`;
    const endParam = `${end[1]},${end[0]}`;
    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${startParam}&end=${endParam}`;

    const res = await fetchWithTimeout(url, {}, 3000);
    if (!res.ok) {
      console.warn(`[Route API] ORS ${profile} ルート取得失敗 (Status: ${res.status})`);
      return null;
    }

    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const coordinates: [number, number][] = data.features[0].geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }
    return coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.warn(`[Route API] ORS ${profile} 通信エラー:`, error);
    return null;
  }
}

/**
 * OSRM（Open Source Routing Machine）からルートを取得
 */
async function fetchRouteWithOSRM(
  start: LatLngTuple,
  end: LatLngTuple,
  mode: "driving" | "foot"
): Promise<LatLngTuple[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/${mode}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent": "NagasakiNaviApp/1.0",
        },
      },
      3500
    );

    if (!res.ok) {
      console.warn(`[Route API] OSRM ${mode} 取得失敗 (Status: ${res.status})`);
      return null;
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const coordinates: [number, number][] = data.routes[0].geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }
    return coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.warn(`[Route API] OSRM ${mode} 通信エラー:`, error);
    return null;
  }
}

/**
 * POST /api/route
 * Body: { start: [lat, lng], end: [lat, lng], mode?: "driving" | "walking" }
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY || "";

    const body = await request.json();
    const { start, end, mode = "driving" } = body as {
      start: LatLngTuple;
      end: LatLngTuple;
      mode?: "driving" | "walking";
    };

    if (!start || !end || start.length !== 2 || end.length !== 2) {
      return NextResponse.json(
        { error: "無効な座標が指定されました。" },
        { status: 400 }
      );
    }

    // 徒歩ルート
    if (mode === "walking") {
      // 1. ORS (foot-walking)
      const walkingRoute = await fetchRouteWithProfile(start, end, "foot-walking", apiKey);
      if (walkingRoute && walkingRoute.length >= 2) {
        return NextResponse.json({
          coordinates: walkingRoute,
          profile: "foot-walking",
          mode: "walking",
          message: "徒歩ルートを取得しました",
        });
      }

      // 2. OSRM (foot)
      const osrmWalkRoute = await fetchRouteWithOSRM(start, end, "foot");
      if (osrmWalkRoute && osrmWalkRoute.length >= 2) {
        return NextResponse.json({
          coordinates: osrmWalkRoute,
          profile: "foot",
          mode: "walking",
          message: "徒歩ルートを取得しました",
        });
      }

      // 3. 安全なフォールバック: 直線
      return NextResponse.json({
        coordinates: [start, end],
        profile: "straight",
        mode: "walking",
        message: "徒歩ルートを表示します",
      });
    }

    // 車（ドライブ）ルート
    // 1. ORS 大通り優先 (driving-hgv)
    const hgvRoute = await fetchRouteWithProfile(start, end, "driving-hgv", apiKey);
    if (hgvRoute && hgvRoute.length >= 2) {
      return NextResponse.json({
        coordinates: hgvRoute,
        profile: "driving-hgv",
        mode: "driving",
        message: "大通りルート（大型車通行可能）を取得しました",
      });
    }

    // 2. ORS 通常車ルート (driving-car)
    const carRoute = await fetchRouteWithProfile(start, end, "driving-car", apiKey);
    if (carRoute && carRoute.length >= 2) {
      return NextResponse.json({
        coordinates: carRoute,
        profile: "driving-car",
        mode: "driving",
        message: "通常ルートを取得しました",
      });
    }

    // 3. OSRM (driving)
    const osrmDriveRoute = await fetchRouteWithOSRM(start, end, "driving");
    if (osrmDriveRoute && osrmDriveRoute.length >= 2) {
      return NextResponse.json({
        coordinates: osrmDriveRoute,
        profile: "driving",
        mode: "driving",
        message: "ドライブコースを取得しました",
      });
    }

    // 4. 安全なフォールバック: 直線
    return NextResponse.json({
      coordinates: [start, end],
      profile: "straight",
      mode: "driving",
      message: "直線ルートを表示します",
    });
  } catch (error) {
    console.error("[Route API Error]:", error);
    return NextResponse.json(
      { error: "ルート探索中にサーバー内部エラーが発生しました。" },
      { status: 500 }
    );
  }
}
