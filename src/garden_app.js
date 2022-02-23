/**
 * ライブラリの読み込み
*/
require('dotenv').config();
const log4js = require('log4js')
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.tz.setDefault('Asia/Tokyo');
const logger = log4js.getLogger('system');
const symbol_sdk_1 = require('symbol-sdk');
const op = require('rxjs');
const BlackMosaicList = require('./models').GardenBlackMosaicLists;
const TxList =require('./models').GardenTransactionLists;
const Message =require('./models').GardenMessage;

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
      const transaction = _.data;
      transaction.forEach((tx) => {
        let isMosaic = false;
        if(tx.type === symbol_sdk_1.TransactionType.TRANSFER){
          if(tx.recipientAddress.plain() === signerAddress.address.plain()){
            //受信
            tx.mosaics.forEach(mosaic => {
              //複数のモザイクを検証 ブラックリスト以外のモザイクがあればOK
              if(!_m.find((mos) => mos.mosaic_id === mosaic.id.toHex()) && mosaic.amount.compact() !== 0){ isMosaic = true; }
            });
            if(isMosaic){
              sendTransfar(block.height, tx);
            }
          }
        }
      });
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

  //自身の保有モザイク取得
  const account_mosaics = await getAccountMosaics(signerAddress.address);
  //保有モザイクの詳細を取得
  const mosaics = await getMosaicInfo(account_mosaics, height);
  //保有モザイクより１つをランダムに選出する
  const mosaic = mosaics[Math.floor(Math.random() * mosaics.length)];

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

  let strMsg = "【MosaicGarden】";
  if(isSender.isToday){
    //今日はじめての場合
    strMsg += (await Message.getMessage())[0].message_js + " ";
  }
  strMsg += "The next lottery can be held after " + dayjs().tz().add((transactionInterval + 1), 'm').format('HH:mm') + ".";

  //トランスファートランザクション生成
  const tx = symbol_sdk_1.TransferTransaction.create(
    symbol_sdk_1.Deadline.create(epochAdjustment),
    transaction.signer.address,
    [new symbol_sdk_1.Mosaic(new symbol_sdk_1.MosaicId(mosaic_id), symbol_sdk_1.UInt64.fromUint(mosaic_num * Math.pow(10, mosaic.info.divisibility)))],
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
  if(amount === 1){
    rate = 1;
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
  log("rate:"+rate);
  rand =  getRandomArbitrary(1, rate);
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
 * Gardenアドレスの保有モザイクを取得
 * @param {*} mosaics 
 * @param {*} height 
 * @returns 
 */
const getMosaicInfo = (async (mosaics, height) =>{
  let res = [];
  for(let mosaic of mosaics){
    //TODO 転送不可を弾く処理を追加する
    //モザイクの詳細
    const mosaicId = new symbol_sdk_1.MosaicId(mosaic.id.toHex());
    const mosaicInfo = await mosaicRepository.getMosaic(mosaicId).toPromise();
    const duration = mosaicInfo.duration.compact();
    if(duration === 0 && mosaicInfo.flags.transferable){
      //0期限なしかつ転送可
      const amount = mosaic.amount.compact() / Math.pow(10, mosaicInfo.divisibility);
      log('保有モザイク:'+mosaic.id.toHex() + '保有数:'+amount);
      if(amount > 1){
        //保有数が1以上のもののみ追加
        res.push({'mosaic': mosaic, 'info': mosaicInfo});
      }
    }else{
      //期限あり
      const limit = mosaicInfo.duration.compact()+mosaicInfo.startHeight.compact();
      if(height <= limit){
        const amount = mosaic.amount.compact() / Math.pow(10, mosaicInfo.divisibility);
        if(amount > 1 && mosaicInfo.flags.transferable){
          log('保有モザイク:'+mosaic.id.toHex() + '保有数:'+amount);
          //保有数が1以上のもののみ追加
          res.push({'mosaic': mosaic, 'info': mosaicInfo});
        }
      }
    }
    
  }
  return res;
});

/**
 * モザイクのメタデータ解析
 */
const parseMosaicMetadata = ((mosaic)=>{
  log(mosaic);
});

/**
 * アカウント保有のモザイク取得（Bot対策の為にXYMも入れる）
 */
 const getAccountMosaics = (async(address)=>{
  let mosaic_list=[];
  await accountRepository.getAccountInfo(address)
  .pipe(
    op.mergeMap(_=>_.mosaics),
    op.filter(mo=>{
      if(!_m.find((mos) => mos.mosaic_id === mo.id.toHex())){
        mosaic_list.push(mo);
      }
    })
  ).toPromise();
  return mosaic_list;
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

