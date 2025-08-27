<script setup lang="ts">
import triangleDark from '@images/misc/triangle-dark.png'
import triangleLight from '@images/misc/triangle-light.png'
import trophy from '@images/misc/pricing-tree-3.png'
import { useTheme } from 'vuetify'

const { global } = useTheme()
const triangleBg = computed(() => global.name.value === 'light' ?  triangleLight : triangleDark)
const isProxy = ref(false);
const isDcom = ref(true);
const proxies = ref("");

const changeCheckboxOption = function(){
  isDcom.value = !isProxy.value;
}

const changeCheckboxOptionDcom = function(){
  isProxy.value = !isDcom.value;
}

var getProxyCount = function() {
  ////console.log(proxies.value);
  return "Cấu hình Proxy/Dcom "
   + (proxies && isProxy.value  ? " => Số lượng: " + proxies.value.split('\n').filter(x=> x && x.trim()).length: "");
};

</script>

<template>
  <VCard
    title="Cấu hình sản phẩm"
    v-bind:subtitle="getProxyCount()"
    class="position-relative"
  >
  <VRow>
    <VCol cols="9">
      <VRow class="ml-3">
        <VCol    
          cols="4"
          md="4">
            <VCheckbox
              v-model="isProxy"
              label="Chạy Proxy"
              @change="changeCheckboxOption"
            />
            <VCheckbox
              class="mt-2"
              v-model="isDcom"
              label="Chạy Dcom"
              @change="changeCheckboxOptionDcom"
            />
        </Vcol>
        <VCol cols="8" class="pb-2">
          <v-textarea rows="2" v-if="isProxy" label="IP:Port or IP:Port:user:pass"></v-textarea>
        </Vcol>
      </VRow>
    </Vcol>


    <!-- Trophy -->
      <VCol cols="3">
        <VImg
          :src="trophy"
          class="trophy"
        />
      </Vcol>
    </VRow>
  </VCard>
</template>

<style lang="scss">
@use "@layouts/styles/mixins" as layoutsMixins;

.v-card .triangle-bg {
  position: absolute;
  inline-size: 10.375rem;
  inset-block-end: 0;
  inset-inline-end: 0;
}

.v-card .trophy {
  position: absolute;
  inline-size: 4.9375rem;
  inset-block-end: 2rem;
  inset-inline-end: 2rem;
}
</style>
