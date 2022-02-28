<template>
  <div>
    <v-container>
      <v-row v-for="(mosaics,i) in mosaic_list" :key="i">
        <v-col lg="3" md="3" ms="2" v-for="(mosaic, y) in mosaics" :key="y">
          <v-card
            class="mx-auto"
            max-width="300"
          >
            <v-img
              class="white--text align-end mosaic"
              height="100px"
              :src="mosaic.src"
            >
            </v-img>
            <v-card-subtitle>{{mosaic.title}}</v-card-subtitle >
            <v-card-text class="text--primary">
              <div>
                {{ mosaic.metadata }}
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

import ListView from '../components/List.vue';
import NewTransaction from '../components/NewTransactionCard.vue';

import * as symbolSdk from 'symbol-sdk';
import * as op from 'rxjs/operators';
import {ng_mosaic_lists} from '../../config/nglist';

export default {
  data() {
    return {
      mosaic_list:[
        [
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          }
        ],
        [
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          },
          {
            "src": "https://cdn.vuetifyjs.com/images/cards/docks.jpg",
            "title": "モザイク名",
            "metadata": "メタデータ",
          }
        ]
      ]
    }
  },
}
</script>

<style scoped>
.mosaic{
	-ms-filter: blur(6px);
	filter: blur(6px);
}
</style>