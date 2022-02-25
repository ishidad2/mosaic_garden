# src

## Project setup
```
yarn install
```

### Start nodejs
```
node app.js
```

# 参考資料
https://blog.capilano-fw.com/?p=5546
https://blog.capilano-fw.com/?p=5582
https://qiita.com/mima_ita/items/014dcb42872f3a10855b

# マイグレーションを使う

## モデルをつくる

```
npx sequelize-cli model:generate --name GardenBlackLists --attributes address:string
npx sequelize-cli model:generate --name GardenMessage --attributes message_ja:string,message_en:string

```

## マイグレーション実行

```
npx sequelize-cli db:migrate
```

## シーダー実行

```
npx sequelize-cli db:seed:all
```

## テーブル全削除（使う場合は気をつけて使う）

```
npx sequelize-cli db:migrate:undo:all
```

## メタデータ説明

以下のフォーマットでモザイクのメタデータに配布時期、配布枚数を設定することが出来る

```
{
  "mosaic_id":"616A7782D30DEEB8",
  "dist_num":10,
  "open_date":"2022-02-25",
  "close_date":"2022-02-25",
  "scope":1
}
```

* mosaic_id: 対象となるモザイクID（設定するモザイクと同等のもの、モザイクIDとここの値が違う場合は配布を行わない）
* dist_num: 1回の返送時に送る枚数（整数で指定）
* open_date: 開始日（当日含む）
* close_date: 終了日（当日含む）
* scope: 0を指定すると開始・終了を無視して継続、1を指定すると開始・終了に沿って配布
