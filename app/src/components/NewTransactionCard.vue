<template>
  <div>
    <v-card class="mx-auto" color="#FFFFFF90">
      <template v-if="show">
        <v-progress-linear color="blue" height="20" buffer-value="0" stream class="font-italic text--disabled">
          Receiving
        </v-progress-linear>
      </template>
      <template v-else>
          <v-progress-linear color="red" height="20" buffer-value="0" stream class="font-italic text--disabled">
          Not Receiving(please reload)
        </v-progress-linear>
      </template>
      <v-row class="mb-2 pa-2">
        <v-col cols="12" lg="6">
          <v-card>
            <v-list max-height="250" height="250" class="overflow-y-auto">
              <v-subheader>History of mosaic reception</v-subheader>
              <v-list-item v-for="(item, i) in recipt_items" :key="i">
                <v-list-item-icon>
                  <template v-if="item.newB && i == 0">
                    <div class="box" >
                      <v-icon color="orange darken-2">mdi-new-box</v-icon>
                    </div>
                  </template>
                  <template v-else>
                    <v-icon>mdi-handshake-outline</v-icon>
                  </template>
                </v-list-item-icon>
                <v-list-item two-line>
                  <v-list-item-content v-for="(list, j) in display(item)" :key="j">
                    <v-list-item-title>Mosaic:{{ list.name }}</v-list-item-title>
                    <v-list-item-subtitle>Address:{{ list.signerAddress }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card tile>
            <v-list max-height="250" height="250" class="overflow-y-auto">
              <v-subheader>History of mosaic sending</v-subheader>
              <v-list-item v-for="(item, i) in send_items" :key="i">
                <v-list-item-icon>
                  <template v-if="item.newB && i == 0">
                    <div class="box" >
                      <v-icon color="orange darken-2">mdi-new-box</v-icon>
                    </div>
                  </template>
                  <template v-else>
                    <v-icon>mdi-hand-coin</v-icon>
                  </template>
                </v-list-item-icon>
                <v-list-item-content v-for="(list, j) in display(item)" :key="j">
                  <v-list-item-title>Mosaic:{{ list.name }}</v-list-item-title>
                  <v-list-item-subtitle>Address:{{ list.recipientAddress }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>

export default {
  props:{
    histories:{
      type: Object,
      defualt: () => {}
    },
  },
  data: function(){
    return {
      recipt_items: this.histories.receive_mosaics,
      send_items: this.histories.send_mosaics,
      show: false,
    }
  },
  methods: {
    display(item){
      let res = [];
      const signerAddress = item.signer.address.plain();
      const recipientAddress = item.recipientAddress.plain();
      item.mosaics.forEach(mosaic => {
        res.push({signerAddress: signerAddress, recipientAddress: recipientAddress, name: mosaic.id.toHex(), amount: mosaic.amount.compact()});
      });
      return res;
    }
  },
}
</script>

<style scoped>
.box{
  animation: flash 1.5s infinite linear;
}

@keyframes flash {
  0%,100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>