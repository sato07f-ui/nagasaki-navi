export type LatLngTuple = [number, number];

export interface RouteResult {
    coordinates: LatLngTuple[];
    profile?: "driving-hgv" | "driving-car";
    message?: string;
    error?: string;
}

/**
 * 2地点間の道路ルートを取得する
 * Next.jsのバックエンドAPI（/api/route）を経由してOpenRouteServiceを呼び出すことで、
 * APIキーをクライアント側に露出させずに安全にルートを取得します。
 */
export async function fetchRoute(
    start: LatLngTuple,
    end: LatLngTuple
): Promise<RouteResult> {
    try {
    const res = await fetch("/api/route", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end }),
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