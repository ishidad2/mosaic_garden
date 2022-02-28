<template>
  <div>
    <v-container>
       <v-card elevation="2" class="mb-3">
        <v-card-title>
          CreateMetaData
        </v-card-title>
        <v-card-text>
          <form>
              <v-text-field
              label="mosaic_id(モザイクID)"
              hide-details="auto"
              :rules="mosaicRules"
              required
              v-model="inputForm.mosaic_id"
            ></v-text-field>
            <v-select
              v-model="inputForm.dist_num"
              :items="select_items"
              label="Number of mosaics to be distributed at the time of the lottery(抽選時のモザイク配布枚数)"
              required
            ></v-select>
            <v-dialog
              ref="open_dialog"
              v-model="open_modal"
              :return-value.sync="inputForm.open_date"
              persistent
              width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="inputForm.open_date"
                  label="Distribution start date(配布開始日)"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                 :disabled="checkbox"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="inputForm.open_date"
                scrollable
                :max="inputForm.close_date"
              >
                <v-spacer></v-spacer>
                <v-btn
                  text
                  color="primary"
                  @click="open_modal = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  text
                  color="primary"
                  @click="$refs.open_dialog.save(inputForm.open_date)"
                >
                  OK
                </v-btn>
              </v-date-picker>
            </v-dialog>
            <v-dialog
              ref="close_dialog"
              v-model="close_modal"
              :return-value.sync="inputForm.close_date"
              persistent
              width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="inputForm.close_date"
                  label="Distribution end date(配布終了日)"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                 :disabled="checkbox"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="inputForm.close_date"
                scrollable
                :min="inputForm.open_date"
              >
                <v-spacer></v-spacer>
                <v-btn
                  text
                  color="primary"
                  @click="close_modal = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  text
                  color="primary"
                  @click="$refs.close_dialog.save(inputForm.close_date)"
                >
                  OK
                </v-btn>
              </v-date-picker>
            </v-dialog>
            <v-checkbox
              v-model="checkbox"
              @change="checkbox_change"
              label="配布期限なし"
            ></v-checkbox>
          </form>
          <v-row>
            <v-col cols="12">
              <h3 oncopy="return false">
                {{ output }} 
              </h3>
            </v-col>
            <v-col cols="12">
              <v-btn
                :disabled="inputForm.mosaic_id === ''"
                color="success"
                elevation="2"
                @click="copy()"
              >
                Parapeter Copy(メタデータ設定値コピー)
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script>

export default {
  data() {
    return {
      inputForm:{
        mosaic_id: '',
        dist_num: 1,
        open_date: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
        close_date: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
        scope: 1,
      },
      select_items: [1,2,3,4,5,6,7,8,9,10],
      open_modal: false,
      close_modal: false,
      checkbox: false,
      mosaicRules: [
        v => !!v || 'mosaic_id is required',
      ],
    }
  },
  computed: {
    output(){
      return this.inputForm;
    }
  },
  methods: {
    checkbox_change(e){
      if(e){
        this.inputForm.scope = 0
      }else{
        this.inputForm.scope = 1
      }
    },
    copy(){
      navigator.clipboard.writeText(JSON.stringify(this.inputForm))
      .then(() => {
        alert("copied!");
      })
      .catch(e => {
        console.error(e);
      })
    }
  },
}
</script>