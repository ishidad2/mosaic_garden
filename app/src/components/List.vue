<template>
  <div>
    <v-card class="mx-auto">
    <v-list max-height="250" height="250" class="overflow-y-auto">
      <v-subheader>Stock Mosaics</v-subheader>
      <v-list-item v-for="(item, i) in items" :key="i">
        <v-list-item-icon>
        <v-icon>mdi-gift</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Mosaic:<span class="mosaic">{{ item.mosaicInfo.id.toHex() }}</span></v-list-item-title>
          <v-list-item-subtitle>amount:{{ item.mosaic.amount.compact() }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
  </div>
</template>

<script>
export default {
  props:{
    pItems:{
      type: Array,
      defualt: () => []
    },
  },
  data: function(){
    return {
      items: this.pItems,
    }
  },
  methods: {
    update(){
      this.items = this.pItems;
    }
  },
}
</script>

<style scoped>
.mosaic{
	-ms-filter: blur(3px);
	filter: blur(3px);
}
</style>