import { getAllSpots, SpotItem } from "../utils/parkingService";

interface SpotInfoProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpot: (spotId: string) => void;
}

interface PrimaryLink {
  href: string;
  label: string;
  badgeClassName: string;
}

/**
 * 観光地一覧で表示するURLを優先順位（Instagram > X > url）で1つ選択する
 */
function getPrimarySpotLink(spot: SpotItem): PrimaryLink | null {
  if (spot.insta) {
    return {
      href: spot.insta,
      label: "Instagram",
      badgeClassName: "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100",
    };
  }
  if (spot.x) {
    return {
      href: spot.x,
      label: "X",
      badgeClassName: "border-slate-800 bg-slate-900 text-white hover:bg-slate-700",
    };
  }
  if (spot.url) {
    return {
      href: spot.url,
      label: "詳細",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
    };
  }
  return null;
}

export function SpotInfo({
  isOpen,
  onClose,
  onSelectSpot,
}: SpotInfoProps) {
  if (!isOpen) return null;

  const spots = getAllSpots();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 px-5 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/40 bg-white/85 p-5 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-slate-800">観光地一覧</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/70 text-xl text-slate-700 shadow transition hover:bg-white active:scale-95"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div>
          {spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              onSelect={() => onSelectSpot(spot.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SpotCard({
  spot,
  onSelect,
}: {
  spot: SpotItem;
  onSelect: () => void;
}) {
  const primaryLink = getPrimarySpotLink(spot);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="mb-3 last:mb-0 cursor-pointer rounded-2xl bg-white/70 p-4 transition-colors hover:bg-white"
    >
      <div className="flex gap-3">
        <span className="text-pink-500">📌</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="m-0 font-bold text-slate-800">{spot.name}</h3>
              {primaryLink && (
                <a
                  href={primaryLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${primaryLink.badgeClassName}`}
                >
                  <span>{primaryLink.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
            <span className="shrink-0 text-xs font-semibold text-blue-600">
              選択 ➔
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {spot.description}
          </p>
        </div>
      </div>
    </div>
  );
}
