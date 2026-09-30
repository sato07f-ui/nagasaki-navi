"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet"; // ← これを追加
import intersections from "../data/intersection.json";

// ▼▼ ここから追加 ▼▼
// Next.jsでLeafletのデフォルトマーカー画像が表示されない問題を解決
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
// ▲▲ ここまで ▲▲

const dangerIcon = L.icon({
  iconUrl: "/danger_icon.svg", 
  iconSize: [32, 32],          
  iconAnchor: [16, 32],        
  popupAnchor: [0, -32],       
});

const MapComponent = () => {
  // 長崎駅付近の座標
  const position: [number, number] = [32.752405, 129.871058];

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      {/* 国土地理院の淡色地図を使用（APIキー不要！） */}
      <TileLayer
        attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
        url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>長崎駅！ここからスタート！</Popup>
      </Marker>

    {/* JSONの交差点データをループしてビックリマークを描画 */}
      {intersections.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={dangerIcon} 
        >
          <Popup>
            <div style={{ minWidth: "150px" }}>
              <strong style={{ color: "#d97706", fontSize: "14px" }}>
                {spot.name}
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#374151" }}>
                {spot.description}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

    </MapContainer>
  );
};

export default MapComponent;
