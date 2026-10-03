This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

<div id="top"></div>

# 🔰 長崎ナビ (Nagasaki Navi) 開発ガイド

長崎初心者向けの「パーク＆ライド」や「おせっかいナビ機能」を提供するマップアプリです。

## 使用技術一覧

<!-- シールド一覧 -->
<!-- 該当するプロジェクトの中から任意のものを選ぶ-->
<p style="display: inline">
  <!-- フロントエンドのフレームワーク一覧 -->
  <img src="https://img.shields.io/badge/-Node.js-000000.svg?logo=node.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-Next.js-000000.svg?logo=next.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-TailwindCSS-000000.svg?logo=tailwindcss&style=for-the-badge">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <!-- バックエンドのフレームワーク一覧 -->
  <!-- バックエンドの言語一覧 -->
  <img src="https://img.shields.io/badge/-TypeScript-007ACC.svg?logo=typescript&style=for-the-badge&logoColor=FFFFFF">
</p>

## 🛠 前提条件 (必要なツール)

開発を始める前に、自分のPCに以下がインストールされているか確認してください。

- **Node.js**
- **Git**

## 🚀 最初の環境構築手順 (初回のみ)

まだ自分のPCにコードがない場合は、以下の手順でプロジェクトをセットアップします。

### 1. リポジトリをクローンする

ターミナルを開き、開発用のフォルダを置きたい場所で以下のコマンドを実行します。

```bash
git clone https://github.com/sato07f-ui/nagasaki-navi.git
```

### 2.プロジェクトのフォルダに移動する

```bash
cd nagasaki-navi
```

### 3. 必要なパッケージをインストールする

```bash
npm install
```

### 4. 環境変数ファイル (.env.local) を作成する ⚠️重要!

ルート（経路）表示機能を利用するためには、OpenRouteService (ORS) のAPIキーが必要です。

プロジェクトのルート直下にある .env.example をコピーして、同じ階層に .env.local という名前で新規ファイルを作成します。
(※ コマンドで作成する場合: `cp .env.example .env.local`)

作成した .env.local を開き、用意してあるAPIキーを記述します。

### 5.ローカルサーバーを立ち上げる

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスし、長崎の地図が表示されればセットアップ完了！
