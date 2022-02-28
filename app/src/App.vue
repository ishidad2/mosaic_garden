<template>
  <div>
    <!-- App.vue -->
    <v-app>
      <v-app-bar app color="#00000000" class="white--text">
        <h1>Mosaic Garden</h1>
        <v-spacer></v-spacer>
        <v-menu
          left
          bottom
        >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon color="#ffffff">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                <router-link to="/mosaic_garden">Home</router-link>
              </v-list-item-title>
              <v-list-item-title>
                <router-link to="/mosaic_garden/CreateMeta">CreateMeta</router-link>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        </v-menu>
      </v-app-bar>
      
      <v-main>
        <router-view></router-view>
      </v-main>
    </v-app>
  </div>
</template>

<script>

export default {

}
</script>

<style>
  #app {
    background-image:url("./assets/img/XYM_City.jpg");
    background-repeat: no-repeat;
    background-size:cover;
    background-position:center center;
  }
</style>