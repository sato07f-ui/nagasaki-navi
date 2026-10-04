export type LatLngTuple = [number, number];

export interface RouteResult {
  coordinates: LatLngTuple[];
  profile?: string;
  mode?: "driving" | "walking";
  message?: string;
  error?: string;
}

/**
 * 2地点間のルートを取得する
 * mode: "driving"（車ルート：現在地〜駐車場）または "walking"（徒歩ルート：駐車場〜目的地）
 */
export async function fetchRoute(
  start: LatLngTuple,
  end: LatLngTuple,
  mode: "driving" | "walking" = "driving"
): Promise<RouteResult> {
  try {
    const res = await fetch("/api/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ start, end, mode }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        coordinates: [],
        error: data.error || `エラーが発生しました (Status: ${res.status})`,
      };
    }

    return {
      coordinates: data.coordinates,
      profile: data.profile,
      mode: data.mode,
      message: data.message,
    };
  } catch (error) {
    console.error("ルート取得通信エラー:", error);
    return {
      coordinates: [],
      error: "サーバーとの通信に失敗しました。ネットワーク状況を確認してください。",
    };
  }
}
