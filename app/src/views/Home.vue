<template>
  <div>
    <v-container>
      <v-row dense>
        <v-col
          v-for="card in cards"
          :key="card.title"
          :cols="card.flex"
        >
          <v-card>
            <v-img
              :src="card.src"
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
              height="200px"
            >
              <v-card-title v-text="card.title"></v-card-title>
            </v-img>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn icon>
                <router-link :to="card.link">
                  <v-icon>mdi-arrow-top-right-bold-outline</v-icon>
                </router-link>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cards: [
        { title: 'Mosaics', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg', flex: 3, link:{name: "Mosaics"} },
        { title: 'CreateMeta', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg', flex: 3, link:{name: "Meta"} },
        { title: 'GardenAccount', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg', flex: 3, link:{name: "Tx"} },
      ]
    }
  },
}
</script>
