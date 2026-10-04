import spotsData from "../data/spot.json";
import parkingsData from "../data/parking.json";

// 駐車場から目的地まで路面電車で移動する場合の案内
export interface TramGuide {
  board_stop: string; // 乗車停留所
  line: string; // 系統番号
  direction: string; // 行き先
  alight_stop: string; // 降車停留所
}

export interface SpotItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  osekkai_message?: string;
  recommended_parking_id?: string;
  tram_guide?: TramGuide;
}

export interface ParkingItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price?: string;
  capacity?: string;
  twentyfour_h?: string;
  three_dim?: string;
  url?: string;
  walk_lat?: number; // 歩行者用出口の緯度（徒歩ルートの始点。未設定なら lat を使用）
  walk_lng?: number; // 歩行者用出口の経度（未設定なら lng を使用）
  spot_key: string | string[];
}

export function getAllSpots(): SpotItem[] {
  return spotsData as SpotItem[];
}

export function getAllParkings(): ParkingItem[] {
  return parkingsData as ParkingItem[];
}

export function getSpotById(spotId: string): SpotItem | undefined {
  return (spotsData as SpotItem[]).find((s) => s.id === spotId);
}

export function getSpotByName(name: string): SpotItem | undefined {
  return (spotsData as SpotItem[]).find((s) => s.name === name);
}

/**
 * 観光地IDに紐づく駐車場を取得する
 * 1. spot.recommended_parking_id が存在し、一致する駐車場があればそれを優先
 * 2. parking.spot_key に spot.id（またはエイリアス）が含まれる駐車場を取得
 */
export function getParkingForSpot(spotId: string): ParkingItem | undefined {
  const spot = getSpotById(spotId);
  const parkings = parkingsData as ParkingItem[];

  // エイリアス対応 (例: chinatown <-> china_town, urakami_cathedral <-> urakami_church)
  const targetKeys = [spotId];
  if (spotId === "chinatown") targetKeys.push("china_town");
  if (spotId === "china_town") targetKeys.push("chinatown");
  if (spotId === "urakami_cathedral") targetKeys.push("urakami_church");
  if (spotId === "urakami_church") targetKeys.push("urakami_cathedral");

  // 1. recommended_parking_id の照合
  if (spot?.recommended_parking_id) {
    const recommended = parkings.find((p) => p.id === spot.recommended_parking_id);
    if (recommended) {
      return recommended;
    }
  }

  // 2. spot_key の照合
  const matched = parkings.find((p) => {
    if (Array.isArray(p.spot_key)) {
      return p.spot_key.some((key) => targetKeys.includes(key));
    }
    return targetKeys.includes(p.spot_key);
  });

  return matched;
}
