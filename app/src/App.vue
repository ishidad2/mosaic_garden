<template>
  <div>
    <!-- App.vue -->
    <v-app>
      <v-app-bar app color="#00000000" class="white--text">
        <h1>Mosaic Garden</h1>
      </v-app-bar>
      <v-main>
        <v-container>
          <v-row>
            <v-col cols="12" lg="6" ms="12">
              <v-card elevation="2" class="mb-3">
                <v-card-title>
                  Garden Address
                </v-card-title>
                <v-card-text>
                  <h3>{{ g_rawAddress.plain() }}<v-icon class="ml-3" @click="copy">mdi-content-copy</v-icon></h3>
                </v-card-text>
                <v-card-text>
                  Please send your mosaic to the address above. (Except XYM)<br />
                  Money transfer from multisig addresses is not supported. Aggregate transactions are not supported.
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" lg="6" ms="12">
              <v-card elevation="2" class="mb-3">
                <v-card-title>
                  User Address
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" lg="9" ms="12">
                      <v-text-field v-model="rawAddress" disabled label="今後実装予定"></v-text-field>
                    </v-col>
                    <v-col>
                      <v-btn class="btn" disabled>SSSへ署名を送る</v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <new-transaction ref="tx" :histories="histories"></new-transaction>
          <list-view ref="mosaic_list" :p-items="mosaics"></list-view>
          <v-snackbar 
            absolute
            bottom
            :color="color"
            outlined
            v-model="snackbar">
              {{ snackbarMsg }}
          </v-snackbar>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script>
const NODE = "https://yamatanoorochi.sfn.tools:3001";
import ListView from './components/List.vue';
import NewTransaction from './components/NewTransactionCard.vue';

import * as symbolSdk from 'symbol-sdk';
import * as op from 'rxjs/operators';
import {ng_mosaic_lists} from '../config/nglist';

export default {
  components: {
    ListView,
    NewTransaction
  },
  data: function (){
    return {
      mosaics: [],
      g_rawAddress: symbolSdk.Address.createFromRawAddress("TD4B6MK7BKOKA3WJH74YDZODG5QN5DFXBCOSWNQ"),
      rawAddress: '',
      nglist: ng_mosaic_lists,
      accountRepository: null,
      namespaceRepository: null,
      mosaicRepository: null,
      transactionRepository: null,
      snackbar: false,
      multiLine: true,
      listener: null,
      init: true,
      histories: {
        receive_mosaics: [],
        send_mosaics: []
      },
      color: '',
      snackbarMsg: '',
      recipientAudio: new Audio(require('@/assets/audio/ding.ogg')),
    }
  },
  created(){
    this.$nextTick(()=>{
      const repositoryFactory = new symbolSdk.RepositoryFactoryHttp(NODE);
      this.accountRepository = repositoryFactory.createAccountRepository();
      this.transactionRepository = repositoryFactory.createTransactionRepository()
      this.mosaicRepository = repositoryFactory.createMosaicRepository();
      this.namespaceRepository = repositoryFactory.createNamespaceRepository();

      this.getAccountInfo();
      this.getTransfers();
      this.openListener();
    });
  },
  destroyed() {
    this.closeListenr();
  },
  methods: {
    async getTransfers(){
      const txs = await this.transactionRepository.search({
        address: this.g_rawAddress,
        group: symbolSdk.TransactionGroup.Confirmed,
        pageSize: 10,
        order:"desc"}).toPromise();
      this.parseTx(txs.data);
      this.init = false;
    },
    getAccountInfo(){
      this.accountRepository.getAccountInfo(this.g_rawAddress)
      .pipe(
        op.mergeMap(_=>_.mosaics),
        op.filter(mo=>{
          return !this.nglist.find((mos) => mos === mo.id.toHex())
        })
      )
      .subscribe(_=>{
        if(_.amount.compact() !== 0){
          const mosaicId = new symbolSdk.MosaicId(_.id.toHex());
          this.mosaicRepository.getMosaic(mosaicId).subscribe(m=>this.mosaics.unshift({'mosaicInfo':m, 'mosaic': _}));
          this.$refs.mosaic_list.update();
        }
      });
    },
    openListener(){
      const wsEndpoint = NODE.replace('http', 'ws') + "/ws";
      this.listener = new symbolSdk.Listener(wsEndpoint, this.namespaceRepository, WebSocket);
      this.listener.open().then(()=>{
        this.$refs.tx.show = true;
        console.log('listener open');
        this.listener.newBlock().subscribe((block) => {
          this.$refs.tx.show = true;
          this.newBlock(block);
        },
        (err) => {
          try{
            this.$refs.tx.show = false;
          }catch(e){
            console.log("listener error");
            console.log(e);
          }
        });
      });

      this.listener.webSocket.onclose = async function(){
        try {
          console.log("listener onclose");
          this.$refs.tx.show = false;
        } catch (error) {}
      }
    },
    closeListenr(){
      this.listener.close();
      this.listener = null;
      try {
        this.$refs.tx.show = false;
      } catch (error) {}
      console.log("listener onclose");
    },
    copy(){
      console.log("address copy");
      navigator.clipboard.writeText(this.g_rawAddress.plain())
        .then(() => {
            console.log("copied!");
            this.snackbarMsg = "address copy";
            this.color = "success";
            this.snackbar = true;
        })
        .catch(e => {
            console.error(e)
        })
    },
    newBlock(block){
      //受信
      this.transactionRepository.search({
        address: this.g_rawAddress,
        height: block.height,
        group: symbolSdk.TransactionGroup.Confirmed,
      })
      .subscribe(_ =>{
        if(_.data.length > 0){
          this.parseTx(_.data);
          this.$set(this, "mosaics", []);
          this.getAccountInfo();
        }
      })
    },
    parseTx(transaction){
      transaction.forEach((tx) => {
        //トランスファートランザクションのみ処理
        if(tx.type === symbolSdk.TransactionType.TRANSFER){
          if(tx.recipientAddress.plain() === this.g_rawAddress.plain()){
              tx.mosaics.forEach(mosaic => {
                if(!this.nglist.find((mos) => mos === mosaic.id.toHex()) && mosaic.amount.compact() !== 0){
                  this.histories.receive_mosaics.unshift(tx);
                  if(!this.init){
                    this.soundPlay("recipient");
                  }
                }
              });
          }else{
            tx.mosaics.forEach(mosaic => {
              if(!this.nglist.find((mos) => mos === mosaic.id.toHex()) && mosaic.amount.compact() !== 0){
                this.histories.send_mosaics.unshift(tx);
                if(!this.init){
                  this.soundPlay();
                }
              }
            });
          }
        }
      });
    },
    soundPlay(flg){
      this.recipientAudio.currentTime = 0 
      this.recipientAudio.play();
      this.snackbarMsg = "transaction receiving";
      this.color = "orange darken-2";
      this.snackbar = true;
    },
  },
}
</script>

<style>
  #app {
    background-image:url("./assets/img/XYM_City.png");
    background-repeat: no-repeat;
    background-size:cover;
    background-position:center center;
  }
</style>