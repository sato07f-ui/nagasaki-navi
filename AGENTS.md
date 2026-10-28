<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# プロジェクト概要

長崎ナビ（nagasaki-navi）は、長崎に不慣れなドライバー向けの「パーク＆ライド型」観光ルート案内Webアプリ。長崎ハッカソン2026で開発し、現在は継続開発中。

- ユーザーが目的の観光地を選ぶと、次の2区間を地図上に表示する
  1. 現在地 → 観光地ごとのおすすめ駐車場：大通りを優先した車ルート
  2. 駐車場 → 観光地：徒歩ルート（浜町アーケードのみ路面電車の乗り方も案内）
- 補助機能：事故の多い交差点の警告、長崎弁の「おせっかいメッセージ」、駐車場の詳細（料金・台数・公式リンク）
- 設計方針は「長崎初心者にやさしい」こと。機能を追加・変更するときもこの方針を優先する
- 観光地・駐車場・注意交差点は DB を使わず `src/data/*.json` の静的データで管理している（MVP時点で観光地11件・駐車場10件・交差点3件）
- ルート検索は外部API（OpenRouteService → OSRM → 直線の順にフォールバック）を `src/app/api/route/route.ts` 経由で呼ぶ。ORS の APIキーは環境変数 `ORS_API_KEY`（`.env.local`）
- ユーザー向けの文言・コメント・コミットメッセージは日本語

# ディレクトリ構成と配置ルール

- `src/app/` … ページ（`page.tsx`）とAPIだけを置く。UI部品は置かない
- `src/app/api/route/route.ts` … 外部ルートAPI（ORS / OSRM）を呼ぶのはここだけ。APIキーが漏れるので、クライアントから直接呼ばない
- `src/components/` … UI部品。部品専用の CSS は同じ名前で横に置く（例：`MapComponent.tsx` と `MapComponent.css`）
  - `MapComponent.tsx` は Leaflet を使うため SSR できない。読み込むときは `next/dynamic` の `ssr: false` を使う（`src/app/map/page.tsx` を参照）
- `src/data/*.json` … 観光地（spot）、駐車場（parking）、注意交差点（intersection）のデータ。データを追加するときはここを編集する。駐車場は `spot_key` に観光地の `id` を入れて結びつける
- `src/utils/` … UIを持たない処理。`RouteService.ts` は `/api/route` を呼び、`parkingService.ts` はJSONを検索する
- `public/` … 画像・アイコン。使わなくなったファイルは削除する
- import は既存のコードに合わせて相対パスで書く
