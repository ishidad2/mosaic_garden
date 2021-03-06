/**
 * ライブラリの読み込み
*/
require('dotenv').config();
const log4js = require('log4js')
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.tz.setDefault('Asia/Tokyo');
dayjs.extend(require('dayjs/plugin/isBetween'));
const logger = log4js.getLogger('system');
const symbol_sdk_1 = require('symbol-sdk');
const op = require('rxjs');
const BlackMosaicList = require('./models').GardenBlackMosaicLists;
const TxList = require('./models').GardenTransactionLists;
const Message = require('./models').GardenMessage;
const limitBreak = require('./models').GardenLimittBreak;

log4js.configure({
appenders : {
  system : {
    type : 'file', filename : 'log/system.log'}
  },
  categories : {
    default : {appenders : ['system'], level : 'debug'},
  }
});
let node;
let networkType;
let repositoryFactory;
let transactionRepository;
let accountRepository;
let mosaicRepository;
let networkRepository;
let metadataHttp;
let _m;
let medianFeeMultiplier; //手数料乗数

if(process.env.TYPE === "MAIN_NET"){
  node = "http://dual-1.nodes-xym.work:3000";
  networkType = symbol_sdk_1.NetworkType.MAIN_NET;
}else{
  node = "http://sym-test-01.opening-line.jp:3000";
  networkType = symbol_sdk_1.NetworkType.TEST_NET;
}

const transactionInterval = 2;  //インターバル
const signerAddress = symbol_sdk_1.Account.createFromPrivateKey(process.env.CERTIFICATE_PRIVATE_KEY, networkType); //送信元アドレス
const mosaic_garden_limit = 2;

/**
* ログ
*/
function log(obj){
  console.log(obj);
  logger.info(obj);
}

/**
 * 新規ブロック処理
 */
const newBlock = (async(block) => {
  let confirmAddress = [];
  //受信
  log('block:'+block.height);
  _m = await BlackMosaicList.findAll();
  //モザイクのブラックリスト取得
  transactionRepository.search({
    address: signerAddress.address,
    height: block.height,
    group: symbol_sdk_1.TransactionGroup.Confirmed,
  })
  .subscribe(_ =>{
    if(_.data.length > 0){
      log(_.data.length);
      const transaction = _.data;
      for(tx of transaction){
        let isMosaic = false;
        if(tx.type === symbol_sdk_1.TransactionType.TRANSFER){
          if(tx.recipientAddress.plain() === signerAddress.address.plain()){
            //受信
            tx.mosaics.forEach(mosaic => {
              //複数のモザイクを検証 ブラックリスト以外のモザイクがあればOK
              if(!_m.find((mos) => mos.mosaic_id === mosaic.id.toHex()) && mosaic.amount.compact() !== 0){
                isMosaic = true;
              }
            });
            if(isMosaic){
              if(confirmAddress.indexOf(tx.signer.address.plain()) === -1){
                sendTransfar(block.height, tx);
              }
              confirmAddress.push(tx.signer.address.plain());
            }
          }
        }
      }
    }
  });
});

/**
 * 指定時間以上のアクセス間隔があるかどうか（diffは分数）,本日の送信状況
 * @param {*} address 
 * @returns
 */
const is_interval = (async (address) => {
  let res = {diff: true, isToday: true};
  const now = dayjs().tz();
  const lastAccess = await TxList.last(address);
  //DBに値がない場合（初）
  if(!lastAccess) return res;
  if(lastAccess.length > 0 ){
    const txDateTime = dayjs(lastAccess[0].createdAt).tz();
    log("最終トランザクション:" + txDateTime.format('YYYY-MM-DD hh:mm:ss') + " now:" + now.format('YYYY-MM-DD hh:mm:ss'));
    //日付の比較
    const diff = now.diff(txDateTime, 'minute');
    log("前回アクセスより:" + diff + "分");
    if(transactionInterval <= diff){
      res.diff =  true;
    }else{
      res.diff = false
    }
    //日付の比較
    res.isToday =  txDateTime.isBefore(now, 'day');
  }
  log(res);
  return res;
})

/**
 * トランザクション送信処理
 */
const sendTransfar = (async(height, transaction)=>{
  log('送信処理実行')
  //指定時間以上の空きが必要
  const isSender = await is_interval(transaction.signer.address.plain());
  if(!isSender.diff){
    //中止
    log('送信中止');
    return;
  }
  //リミットブレイクの有無
  let is_limit_break = true;
  
  //リミット解除モザイクを持っているかどうか
  const limitBreakMosaics = await limitBreak.findAll();

  //送信アカウントの保有モザイクを取得
  const account_mosaics = await getMosaicGardenAccountMosaics(transaction.signer.address,height);

  log("====================================");
  grid_loop:
  for(let limitBreak of limitBreakMosaics){
    log(`======== ${limitBreak.mosaic_id} ==========`);
    for(let mosaics of account_mosaics){
      if(limitBreak.mosaic_id === mosaics.mosaic.id.toHex()){
        log("リミットブレイクモザイクが存在している");
        is_limit_break = true;
        break grid_loop;
      }
      log(mosaics.mosaic.id.toHex());
    }
  }
  log("====================================");

  
  let strMsg = "【MosaicGarden】";
  if(isSender.isToday){
    //今日はじめての場合
    strMsg += (await Message.getMessage())[0].message_js + " ";
  }

  //モザイクガーデンの保有モザイク取得
  const signerAccount_mosaics = await getMosaicGardenAccountMosaics(signerAddress.address,height);
  //保有モザイクより１つをランダムに選出する
  const mosaic = signerAccount_mosaics[Math.floor(Math.random() * signerAccount_mosaics.length)];

  //選出したモザイクから保有数を基準に送信する量を決定
  const mosaic_id = mosaic.mosaic.id.toHex();
  const mosaic_num = send_mosaic_num(mosaic);
  const amount = mosaic.mosaic.amount.compact() / Math.pow(10, mosaic.info.divisibility);
  log('id:'+mosaic_id);
  log('保有量:'+amount);
  log('送信量:'+mosaic_num);
  //epochAdjustmentの取得
  const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
  //generationHashの取得
  const networkGenerationHash = await repositoryFactory.getGenerationHash().toPromise();
  
  //リミットブレイクがtrueの場合、特定モザイクを持ってるので返信OK
  let send_mosaic = [];
  if(is_limit_break && !isSender.isToday){
    send_mosaic = [new symbol_sdk_1.Mosaic(new symbol_sdk_1.MosaicId(mosaic_id), symbol_sdk_1.UInt64.fromUint(mosaic_num * Math.pow(10, mosaic.info.divisibility)))];
  }else{
    strMsg += "Limit break has been activated. A specific mosaic is required to cancel the limit break. ";
  }

  strMsg += "The next lottery can be held after " + dayjs().tz().add((transactionInterval + 1), 'm').format('HH:mm') + ".";
  //トランスファートランザクション生成
  const tx = symbol_sdk_1.TransferTransaction.create(
    symbol_sdk_1.Deadline.create(epochAdjustment),
    transaction.signer.address,
    send_mosaic,
    symbol_sdk_1.PlainMessage.create(strMsg),
    networkType,
  ).setMaxFee(medianFeeMultiplier);

  //署名して送信
  const signedtxd = signerAddress.sign(tx, networkGenerationHash);

  log("hash:"+signedtxd.hash);
  log("payload"+signedtxd.payload);

  transactionRepository.announce(signedtxd).subscribe((x)=>log(x),(er)=>log(er));

  //トランザクション履歴に保存
  await TxList.create({
    address : transaction.signer.address.plain(),
    mosaic_id: mosaic_id,
    hash: signedtxd.hash,
    mosaic_num: mosaic_num,
  });
});

/**
 * 送信モザイク量の計算
 */
const send_mosaic_num = ((mosaic)=>{
  let res = 1;
  //保有数が1以下のモザイクは送信対象から外してあるので、保有数に応じて1～maxまでのモザイク量を返す
  const amount = mosaic.mosaic.amount.compact() / Math.pow(10, mosaic.info.divisibility);
  let rate = 1;
  if(amount >= 2 && amount <=10){
    rate = 1;
    log(1);
  }else if(amount <= 50){
    rate = Math.floor(Math.random() * (amount/2));
    log(2);
  }else if(amount <= 100){
    rate = Math.floor(Math.random() * (amount/2));
    log(2);
  }else if(amount > 100 && amount <= 1000){
    rate = Math.floor(Math.random() * (amount/3));
    log(3);
  }else{
    rate = Math.floor(Math.random() * 864);
    log(4);
  }
  rand =  getRandomArbitrary(1, rate);
  if(mosaic.value){
    log(mosaic.value);
    rand = mosaic.value.dist_num ? mosaic.value.dist_num : 1;
    log("メタデータが設定されています value:"+rand);
  }
  log("rand:"+rand);
  if(mosaic.info.divisibility !== 0){
    res = rand.toFixed(mosaic.info.divisibility);
  }else{
    res = rand.toFixed();
  }
  return res;
});

function getRandomArbitrary(min, max) {
  if(max === 0){max = 1};
  return Math.random() * (max - min) + min;
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
 * @param {*} height ブロック高
 */
const getMosaicInfo = (async(mosaic, height)=>{
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

  return {'mosaic': mosaic, 'info': mosaicInfo, "value": metadata};
});

/**
 * モザイクガーデンの保有モザイクを取得
 * ブラックリスト登録されてるものは除外
 * メタデータに枚数が登録されてるものは枚数を追記
 */
const getMosaicGardenAccountMosaics = (async(address,height)=>{
  let res = [];
  const mosaics = (await accountRepository.getAccountInfo(address).toPromise()).mosaics;
  for await (let mosaic of mosaics){
    const info = await getMosaicInfo(mosaic, height)
    if(info) res.push(info);
  }
  return res;
});


/**
* メイン処理
*/
(async()=>{

  log(signerAddress.address);

  //リポジトリ生成
  repositoryFactory = new symbol_sdk_1.RepositoryFactoryHttp(node);
  networkRepository = repositoryFactory.createNetworkRepository();
  transactionRepository = repositoryFactory.createTransactionRepository();
  accountRepository = repositoryFactory.createAccountRepository();
  mosaicRepository = repositoryFactory.createMosaicRepository();
  metadataHttp = repositoryFactory.createMetadataRepository();
  medianFeeMultiplier = (await networkRepository.getTransactionFees().toPromise()).medianFeeMultiplier;
  
  //リスナー生成
  const listener = repositoryFactory.createListener();
  //リスナーオープン
  listener.open().then(() => {
    log('listner open')
    listener.newBlock().subscribe((block) => {
      newBlock(block);
    });
  }); 
})();