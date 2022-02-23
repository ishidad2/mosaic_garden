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

## テーブル全削除（気をつけて使う）

```
npx sequelize-cli db:migrate:undo:all
```