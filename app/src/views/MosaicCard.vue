<template>
  <div>
    <v-container>

      <v-row v-for="(mosaics,i) in sliceByNumber(mosaics, 6)" :key="i">
        <v-col lg="2" md="4" ms="2" v-for="(mosaic, y) in mosaics" :key="y">
          <v-card
            class="mx-auto"
            max-width="300"
          >
            <v-img
              class="white--text align-end"
              height="100px"
              :src="mosaic.src"
            >
            </v-img>
            <v-card-subtitle>MosaicId:{{mosaic.mosaic.id.toHex()}}</v-card-subtitle >
            <v-card-text class="text--primary">
              <div>
                Namespace:<br>
                <template v-if="mosaic.mosaicName !== ''">
                    <a :href="`https://symbol.fyi/mosaics/${mosaic.mosaic.id.toHex()}`" target="_blank" rel="noopener noreferrer">{{ mosaic.mosaicName }}</a>
                </template>
                <template v-else>
                    No NameSpace
                </template>
              </div>
              <div>
                Metadata:<br>
                <div v-for="(d, j) in mosaic.metadata" :key="j">
                  <template>
                    <div v-if="d.value">
                      {{ dispMeta(d.value) }}
                    </div>
                  </template>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script>
// const NODE = "https://yamatanoorochi.sfn.tools:3001";      //testnet
// const raw_address = "TD4B6MK7BKOKA3WJH74YDZODG5QN5DFXBCOSWNQ";//testnet

const NODE = "https://dual-1.nodes-xym.work:3001";
const raw_address = "NB3YJ6FZ7CRZLMILAW4S6Y3ONUP5TG5GZXGFWNA";
import * as d3 from "d3";

import * as symbolSdk from 'symbol-sdk';
import {ng_mosaic_lists} from '../../config/nglist';

export default {
  data() {
    return {
      mosaics:[],
      accountRepository: null,
      namespaceRepository: null,
      mosaicRepository: null,
      metadataRepository: null,
      g_rawAddress: symbolSdk.Address.createFromRawAddress(raw_address),
      nglist: ng_mosaic_lists,
      event_mosaics:[],
    }
  },
  created() {
    this.$nextTick(()=>{
      console.log(d3);
      const repositoryFactory = new symbolSdk.RepositoryFactoryHttp(NODE);
      this.accountRepository = repositoryFactory.createAccountRepository();
      this.mosaicRepository = repositoryFactory.createMosaicRepository();
      this.namespaceRepository = repositoryFactory.createNamespaceRepository();
      this.metadataRepository =  repositoryFactory.createMetadataRepository();;
      this.getAccountInfo(); 
    });
  },
  methods: {
    async getAccountInfo() {
      const accountInfo = await this.accountRepository.getAccountInfo(this.g_rawAddress).toPromise();
      accountInfo.mosaics.forEach(async(mosaic) =>{
        if(!this.nglist.find((mos) => mos === mosaic.id.toHex())){
          const mosaic_id = new symbolSdk.MosaicId(mosaic.id.toHex());
          const names =  await this.namespaceRepository.getMosaicsNames([mosaic_id]).toPromise();
          const searchCriteria = {
            targetId: mosaic_id,
            metadataType: symbolSdk.MetadataType.Mosaic,
          };
          const metadataEntries = await this.metadataRepository.search(searchCriteria).toPromise();
          let metadata=[];
          for(let entry of metadataEntries.data){
            const metadataEntry = entry.metadataEntry;
            metadata.push(metadataEntry);
          }
          this.mosaics.push({'mosaicName': names[0].names.length > 0 ? names[0].names[0].name : '', 'mosaic': mosaic, 'metadata': metadata});
        }
      });
    },
    sliceByNumber: (array, number) => {
      const length = Math.ceil(array.length / number)
      return new Array(length).fill().map((_, i) =>
        array.slice(i * number, (i + 1) * number)
      )
    },
    dispMeta(value){
      return symbolSdk.Convert.decodeHex(value);
    }
  },
}
</script>