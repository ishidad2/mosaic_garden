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

const _m = require('../app/config/nglist');
const _msg = require('../app/config/message');

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
let blockRepository;

let medianFeeMultiplier; //手数料乗数

if(process.env.TYPE === "MAIN_NET"){
  node = "http://dual-1.nodes-xym.work:3000";
  networkType = symbol_sdk_1.NetworkType.MAIN_NET;
}else{
  node = "http://sym-test-01.opening-line.jp:3000";
  networkType = symbol_sdk_1.NetworkType.TEST_NET;
}

const networkCurrencyMosaicId = new symbol_sdk_1.MosaicId(process.env.MOSAIC_ID);  //手数料用XYMモザイク
const networkCurrencyDivisibility  = 6; //XYMモザイクの過分性
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
const newBlock = ((block) => {
  //受信
  log('block:'+block.height);
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
              if(!_m.ng_mosaic_lists.find((mos) => mos === mosaic.id.toHex()) && mosaic.amount.compact() !== 0){ isMosaic = true; }
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
 * 本日の送信状況
 */
const isToday = (async(tx, epochAdjustment)=>{
  //リポジトリからデータを取得
  const rireki = await transactionRepository.search({
    recipientAddress: tx.signer.address,
    group: symbol_sdk_1.TransactionGroup.Confirmed,
    order: 'desc',
  }).toPromise();
  if(rireki.data.length < 1){
    return false;
  }else{
    //最新（１つ前のトランザクション日時を取得）
    const txTimestamp = (await blockRepository.getBlockByHeight(rireki.data[1].transactionInfo.height).toPromise()).timestamp.compact();
    const txDateTime = dayjs(txTimestamp + epochAdjustment * 1000).tz();
    // const txDateTime = dayjs('2022-02-14').tz();
    const now = dayjs().tz();
    //日付の比較
    log("１つ前のTx日が今日に含まれているかどうか: ");
    log(txDateTime.isBefore(now, 'day'));
    return txDateTime.isBefore(now, 'day');
  }
});

/**
 * トランザクション送信処理
 */
const sendTransfar = (async(height, transaction)=>{
  //自身の保有モザイク取得
  const account_mosaics = await getAccountMosaics();
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

  let strMsg = "";
  if(await isToday(transaction, epochAdjustment)){
    //今日はじめての場合
    strMsg = _msg.message_list[Math.floor(Math.random() * _msg.message_list.length)];
  }


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

});

/**
 * 送信モザイク量の計算
 */
const send_mosaic_num = ((mosaic)=>{
  let res = 1;
  //保有数が1以下のモザイクは送信対象から外してあるので、保有数に応じて1～maxまでのモザイク量を返す
  const amount = mosaic.mosaic.amount.compact() / Math.pow(10, mosaic.info.divisibility);
  let rate = 1;
  if(amount <= 50){
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


const getMosaicInfo = (async (mosaics, height) =>{
  let res = [];
  for(let mosaic of mosaics){
    //モザイクの詳細
    const mosaicId = new symbol_sdk_1.MosaicId(mosaic.id.toHex());
    const mosaicInfo = await mosaicRepository.getMosaic(mosaicId).toPromise();
    const duration = mosaicInfo.duration.compact();
    if(duration === 0){
      //0期限なし
      const amount = mosaic.amount.compact() / Math.pow(10, mosaicInfo.divisibility);
      log('保有モザイク:'+mosaic.id.toHex() + '保有数:'+amount);
      if(amount >= 1){
        //保有数が1以上のもののみ追加
        res.push({'mosaic': mosaic, 'info': mosaicInfo});
      }
    }else{
      //期限あり
      const limit = mosaicInfo.duration.compact()+mosaicInfo.startHeight.compact();
      if(height <= limit){
        const amount = mosaic.amount.compact() / Math.pow(10, mosaicInfo.divisibility);
        log('保有モザイク:'+mosaic.id.toHex() + '保有数:'+amount);
        if(amount >= 1){
          //保有数が1以上のもののみ追加
          res.push({'mosaic': mosaic, 'info': mosaicInfo});
        }
      }
    }
    
  }
  return res;
});

/**
 * アカウント保有のモザイク取得（XYMを除く）
 */
 const getAccountMosaics = (async()=>{
  let mosaic_list=[];
  await accountRepository.getAccountInfo(signerAddress.address)
  .pipe(
    op.mergeMap(_=>_.mosaics),
    op.filter(mo=>{
      if(!_m.ng_mosaic_lists.find((mos) => mos === mo.id.toHex())){
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
  blockRepository = repositoryFactory.createBlockRepository();

  medianFeeMultiplier = (await networkRepository.getTransactionFees().toPromise()).medianFeeMultiplier;
  console.log(medianFeeMultiplier);
  
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

