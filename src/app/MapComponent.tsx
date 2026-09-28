"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const MapComponent = () => {
  // 長崎駅付近の座標
  const position: [number, number] = [32.7503, 129.8778];

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
    </MapContainer>
  );
};

export default MapComponent;
