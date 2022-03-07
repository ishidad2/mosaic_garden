(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-7f4071c8"],{a300:function(e,t,o){"use strict";o.r(t);var n=function(){var e=this,t=e.$createElement,o=e._self._c||t;return o("div",[o("v-container",[o("v-card",{staticClass:"mb-3",attrs:{elevation:"2"}},[o("v-card-title",[e._v(" CreateMetaData ")]),o("v-card-text",[o("form",[o("v-text-field",{attrs:{label:"mosaic_id(モザイクID)","hide-details":"auto",rules:e.mosaicRules,required:""},model:{value:e.inputForm.mosaic_id,callback:function(t){e.$set(e.inputForm,"mosaic_id",t)},expression:"inputForm.mosaic_id"}}),o("v-select",{attrs:{items:e.select_items,label:"Number of mosaics to be distributed at the time of the lottery(抽選時のモザイク配布枚数)",required:""},model:{value:e.inputForm.dist_num,callback:function(t){e.$set(e.inputForm,"dist_num",t)},expression:"inputForm.dist_num"}}),o("v-dialog",{ref:"open_dialog",attrs:{"return-value":e.inputForm.open_date,persistent:"",width:"290px"},on:{"update:returnValue":function(t){return e.$set(e.inputForm,"open_date",t)},"update:return-value":function(t){return e.$set(e.inputForm,"open_date",t)}},scopedSlots:e._u([{key:"activator",fn:function(t){var n=t.on,a=t.attrs;return[o("v-text-field",e._g(e._b({attrs:{label:"Distribution start date(配布開始日)","prepend-icon":"mdi-calendar",readonly:"",disabled:e.checkbox},model:{value:e.inputForm.open_date,callback:function(t){e.$set(e.inputForm,"open_date",t)},expression:"inputForm.open_date"}},"v-text-field",a,!1),n))]}}]),model:{value:e.open_modal,callback:function(t){e.open_modal=t},expression:"open_modal"}},[o("v-date-picker",{attrs:{scrollable:"",max:e.inputForm.close_date},model:{value:e.inputForm.open_date,callback:function(t){e.$set(e.inputForm,"open_date",t)},expression:"inputForm.open_date"}},[o("v-spacer"),o("v-btn",{attrs:{text:"",color:"primary"},on:{click:function(t){e.open_modal=!1}}},[e._v(" Cancel ")]),o("v-btn",{attrs:{text:"",color:"primary"},on:{click:function(t){return e.$refs.open_dialog.save(e.inputForm.open_date)}}},[e._v(" OK ")])],1)],1),o("v-dialog",{ref:"close_dialog",attrs:{"return-value":e.inputForm.close_date,persistent:"",width:"290px"},on:{"update:returnValue":function(t){return e.$set(e.inputForm,"close_date",t)},"update:return-value":function(t){return e.$set(e.inputForm,"close_date",t)}},scopedSlots:e._u([{key:"activator",fn:function(t){var n=t.on,a=t.attrs;return[o("v-text-field",e._g(e._b({attrs:{label:"Distribution end date(配布終了日)","prepend-icon":"mdi-calendar",readonly:"",disabled:e.checkbox},model:{value:e.inputForm.close_date,callback:function(t){e.$set(e.inputForm,"close_date",t)},expression:"inputForm.close_date"}},"v-text-field",a,!1),n))]}}]),model:{value:e.close_modal,callback:function(t){e.close_modal=t},expression:"close_modal"}},[o("v-date-picker",{attrs:{scrollable:"",min:e.inputForm.open_date},model:{value:e.inputForm.close_date,callback:function(t){e.$set(e.inputForm,"close_date",t)},expression:"inputForm.close_date"}},[o("v-spacer"),o("v-btn",{attrs:{text:"",color:"primary"},on:{click:function(t){e.close_modal=!1}}},[e._v(" Cancel ")]),o("v-btn",{attrs:{text:"",color:"primary"},on:{click:function(t){return e.$refs.close_dialog.save(e.inputForm.close_date)}}},[e._v(" OK ")])],1)],1),o("v-checkbox",{attrs:{label:"配布期限なし"},on:{change:e.checkbox_change},model:{value:e.checkbox,callback:function(t){e.checkbox=t},expression:"checkbox"}})],1),o("v-row",[o("v-col",{attrs:{cols:"12"}},[o("h3",{attrs:{oncopy:"return false"}},[e._v(" "+e._s(e.output)+" ")])]),o("v-col",{attrs:{cols:"12"}},[o("v-btn",{attrs:{disabled:""===e.inputForm.mosaic_id,color:"success",elevation:"2"},on:{click:function(t){return e.copy()}}},[e._v(" Parapeter Copy(メタデータ設定値コピー) ")])],1)],1)],1)],1)],1)],1)},a=[],r=(o("e9c4"),{data:function(){return{inputForm:{mosaic_id:"",dist_num:1,open_date:new Date(Date.now()-6e4*(new Date).getTimezoneOffset()).toISOString().substr(0,10),close_date:new Date(Date.now()-6e4*(new Date).getTimezoneOffset()).toISOString().substr(0,10),scope:1},select_items:[1,2,3,4,5,6,7,8,9,10],open_modal:!1,close_modal:!1,checkbox:!1,mosaicRules:[function(e){return!!e||"mosaic_id is required"}]}},computed:{output:function(){return this.inputForm}},methods:{checkbox_change:function(e){this.inputForm.scope=e?0:1},copy:function(){navigator.clipboard.writeText(JSON.stringify(this.inputForm)).then((function(){alert("copied!")})).catch((function(e){console.error(e)}))}}}),i=r,c=o("2877"),u=Object(c["a"])(i,n,a,!1,null,null,null);t["default"]=u.exports},e9c4:function(e,t,o){var n=o("23e7"),a=o("da84"),r=o("d066"),i=o("2ba4"),c=o("e330"),u=o("d039"),l=a.Array,s=r("JSON","stringify"),d=c(/./.exec),p=c("".charAt),m=c("".charCodeAt),_=c("".replace),f=c(1..toString),v=/[\uD800-\uDFFF]/g,b=/^[\uD800-\uDBFF]$/,F=/^[\uDC00-\uDFFF]$/,x=function(e,t,o){var n=p(o,t-1),a=p(o,t+1);return d(b,e)&&!d(F,a)||d(F,e)&&!d(b,n)?"\\u"+f(m(e,0),16):e},h=u((function(){return'"\\udf06\\ud834"'!==s("\udf06\ud834")||'"\\udead"'!==s("\udead")}));s&&n({target:"JSON",stat:!0,forced:h},{stringify:function(e,t,o){for(var n=0,a=arguments.length,r=l(a);n<a;n++)r[n]=arguments[n];var c=i(s,null,r);return"string"==typeof c?_(c,v,x):c}})}}]);
//# sourceMappingURL=chunk-7f4071c8.ede09b09.js.map