import parkingData from "../data/parking.json";
import spotsData from "../data/spot.json";

interface ParkInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParkInfo({ isOpen, onClose }: ParkInfoProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="flex max-h-[75vh] w-full max-w-md flex-col rounded-3xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <div className="text-xs text-slate-500">
            <h3 className="flex items-center gap-1 text-base font-bold text-slate-800">
              市内駐車場一覧（{parkingData.length}箇所）
            </h3>
            <p className="mt-0.5">長崎市内の駐車場情報</p>
            <p>※料金は3時間利用時のものです。詳細はリンク先からご確認ください。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 font-bold text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          {parkingData.map((parking: any) => (
            <ParkingCard key={parking.id} parking={parking} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ParkingCard({ parking }: { parking: any }) {
  const nearbySpots = parking.spot_key
    ?.map((key: string) => spotsData.find((spot) => spot.id === key)?.name)
    .filter(Boolean)
    .join("、");

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">{parking.name}</p>
          {nearbySpots && (
            <p className="text-xs font-medium text-blue-600">近隣観光地: {nearbySpots}</p>
          )}
        </div>
        {parking.url && (
          <a
            href={parking.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-semibold text-sky-600 underline"
          >
            詳細
          </a>
        )}
      </div>

      <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600">
        <p>料金: {parking.price || "-"}</p>
        <p>収容台数: {parking.capacity || "-"}台</p>
        <p>24H: {parking.twentyfour_h || "-"}</p>
        <p>立体駐車場: {parking.three_dim || "-"}</p>
      </div>
    </div>
  );
}
