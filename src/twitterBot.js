/**
 * モザイクガーデンの毎日定時に本日の利用者数を投稿するBot
 */

require('dotenv').config();
const log4js = require('log4js')
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.tz.setDefault('Asia/Tokyo');
dayjs.extend(require('dayjs/plugin/isBetween'));
const Twitter = require('twitter');
const TxList = require('./models').GardenTransactionLists;
const BlackMosaicList = require('./models').GardenBlackMosaicLists;
const symbol_sdk_1 = require('symbol-sdk');

const logger = log4js.getLogger('system');
let accountRepository;
let mosaicRepository;
let chainRepository;
let metadataHttp;
let _m;

log4js.configure({
  appenders : {
    system : { type : 'file', filename : 'log/twitter_bot.log' }
  },
  categories : {
    default : { appenders : ['system'], level : 'debug' },
  }
});

let node;
let twitter = null;

if(process.env.TYPE === "MAIN_NET"){
  node = "http://dual-1.nodes-xym.work:3000";
  networkType = symbol_sdk_1.NetworkType.MAIN_NET;
}else{
  node = "http://sym-test-01.opening-line.jp:3000";
  networkType = symbol_sdk_1.NetworkType.TEST_NET;
}

if(process.env.NODE_ENV === 'production'){
  const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
  const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
  const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
  const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  twitter = new Twitter({
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: TWITTER_ACCESS_TOKEN,
    access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
  });
}

const signerAddress = symbol_sdk_1.Account.createFromPrivateKey(process.env.CERTIFICATE_PRIVATE_KEY, networkType); //送信元アドレス

/**
* ログ
*/
function log(obj){
  console.log(obj);
  logger.info(obj);
}

/**
 * モザイクのメタデータを取得
 * @param {*} mosaic 
 * @returns 
 */
const getMosaicMetadata = (async(mosaic) => {
  let res = null;
  const searchCriteria = {
    targetId: mosaic.id,
    metadataType: symbol_sdk_1.MetadataType.Mosaic,
  };
  const metadataEntries = await metadataHttp.search(searchCriteria).toPromise();
  for(entry of metadataEntries.data){
    const metadataEntry = entry.metadataEntry;
    try{
      res = JSON.parse(symbol_sdk_1.Convert.decodeHex(metadataEntry.value));
      dayjs(res.open_date).tz();
      dayjs(res.close_date).tz();
      Number(res.dist_num);
      Number(res.scope);
      if(res.mosaic_id === mosaic.id.toHex()){
        break;
      }
    }catch(e){
      log('JSON parse error => ' + e);
    }
  }
  return res; 
});

/**
 * メタデータで制限されたモザイクと期限切れモザイクを除くモザイクの詳細を取得
 * @param {*} mosaic 
 */
const getMosaicInfo = (async(mosaic)=>{
  const height = (await chainRepository.getChainInfo().toPromise()).height.compact();
  const now = dayjs().tz();
  //モザイクのメタデータ取得
  const metadata = await getMosaicMetadata(mosaic);
  //モザイクの詳細取得
  const mosaicId = new symbol_sdk_1.MosaicId(mosaic.id.toHex());
  const mosaicInfo = await mosaicRepository.getMosaic(mosaicId).toPromise();
  //モザイクの期限　0:期限なし それ以外:期限あり
  const duration = mosaicInfo.duration.compact();

  if(duration !== 0){
    //モザイクの期限を取得
    const limit = mosaicInfo.duration.compact()+mosaicInfo.startHeight.compact();
    if(height >= limit) {
      log("モザイクの期限切れ");
      return null;  //期限切れ
    }
  }
  //転送可能かどうか
  if(!mosaicInfo.flags.transferable){
    //自身の作成したモザイクかどうか
    if(mosaicInfo.ownerAddress.plain() !== signerAddress.address.plain()) {
      log("転送不可設定で自身が作成したモザイクではありません");
      return null;
    }
  }
  
  //ブラックリストモザイクのチェック
  if(_m.find((mos) => mos.mosaic_id === mosaic.id.toHex())){
    log("ブラックリストに登録されているモザイクです");
    return null;
  }

  //保有数のチェック
  const amount = mosaic.amount.compact() / Math.pow(10, mosaicInfo.divisibility);
  if(amount < 1){
    log("モザイク保有枚数不足です");
    return null;
  }
 
  //メタデータが設定されてる場合
  if(metadata){
    if(metadata.mosaic_id !== mosaicInfo.id.toHex()){
      log('モザイクに設定されているIDが異なります: ' + mosaicInfo.id.toHex());
      return null;
    }
    //イベントスコープが設定されてるかどうか 0:無期限 1:期限あり
    log('イベントスコープ:'+metadata.scope);
    if(metadata.scope !== 0){
      //終了日が開始日より後かどうかのチェック
      const from = dayjs(metadata.open_date).tz();
      const to = dayjs(metadata.close_date).tz();
      if(from.valueOf() > to.valueOf()){
        log("終了日または開始日が不正です("+metadata.mosaic_id+")");
        log('開始日:'+from.format("YYYY-MM-DD"));
        log('終了日:'+to.format("YYYY-MM-DD"));
        return null;
      }
      if(!dayjs(now.format("YYYY-MM-DD")).isBetween(metadata.open_date, metadata.close_date,null, '[]')){
        log(mosaic.id.toHex() + " は配布期限外です！");
        return null;
      }
    }    
    log(mosaic.id.toHex()+" は配れます")
  }

  return mosaic;
});

/**
 * アカウント保有のモザイク取得
 */
const getAccountMosaic = (async()=>{
  let res = [];
  const mosaics = (await accountRepository.getAccountInfo(signerAddress.address).toPromise()).mosaics;
  for await (let mosaic of mosaics){
    const info = await getMosaicInfo(mosaic)
    if(info) res.push(info);
  }
  return res;
});

/**
* メイン処理
*/
(async()=>{
  
  const todays_transaction = await TxList.todays_tx();  //一日に飛ばしたトランザクション数
  const todays_user = await TxList.get_todays_users();  //一日に利用したユーザー数
  log(todays_transaction.length);
  log(todays_user[0].todays_count);

  _m = await BlackMosaicList.findAll();

  //リポジトリ生成
  const repositoryFactory = new symbol_sdk_1.RepositoryFactoryHttp(node);
  accountRepository = repositoryFactory.createAccountRepository();
  mosaicRepository = repositoryFactory.createMosaicRepository();
  chainRepository = repositoryFactory.createChainRepository();
  metadataHttp = repositoryFactory.createMetadataRepository();

  const mosaics = await getAccountMosaic();
  log(mosaics.length);

  let strMsg = `#MosaicGarden の利用状況` + "\n";
  strMsg += `本日の総トランザクション数：${todays_transaction.length}件` + "\n";
  strMsg += `本日の利用者数：${todays_user[0].todays_count}アカウント` + "\n";
  strMsg += `ストックモザイク数：${mosaics.length}モザイク` + "\n";

  let params = {status: strMsg};
  if(twitter){
    twitter.post('statuses/update', params,  (error, tweet, response) => {

      if(error) {
        log('=== Twitter投稿エラー ===');
        log(error);
      } else {
        log("Twitterへ投稿しました");
        log(params);
        // 成功した場合
      }
    });
  }else{
    log('ローカル環境ではTwitterへ投稿することはできません');
    log(params);
  }
})();