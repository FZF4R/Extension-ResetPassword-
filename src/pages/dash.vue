<script  lang="ts">
import AnalyticsAward from '@/views/dashboard/AnalyticsAward.vue';
import AnalyticsBarCharts from '@/views/dashboard/AnalyticsBarCharts.vue';
import AnalyticsDepositWithdraw from '@/views/dashboard/AnalyticsDepositWithdraw.vue';
import AnalyticsSalesByCountries from '@/views/dashboard/AnalyticsSalesByCountries.vue';
import AnalyticsTotalEarning from '@/views/dashboard/AnalyticsTotalEarning.vue';
import AnalyticsTotalProfitLineCharts from '@/views/dashboard/AnalyticsTotalProfitLineCharts.vue';
import AnalyticsTransactions from '@/views/dashboard/AnalyticsTransactions.vue';
import AnalyticsUserTable from '@/views/dashboard/AnalyticsUserTable.vue';
import AnalyticsWeeklyOverview from '@/views/dashboard/AnalyticsWeeklyOverview.vue';
import CardStatisticsVertical from '@core/components/cards/CardStatisticsVertical.vue';
import triangleDark from '@images/misc/triangle-dark.png'
import triangleLight from '@images/misc/triangle-light.png'
import trophy from '@images/misc/pricing-tree-3.png'
import { useTheme } from 'vuetify'
import { ref } from 'vue';

interface DataItem {
  responsiveId: string
  id: number
  uid: string
  description: string
  email: string
  city: string
  start_date: string
  salary: number
  age: string
  experience: string
  status: number
}

const status: Record<DataItem['status'], string> = {
  1: 'Current',
  2: 'Professional',
  3: 'Rejected',
  4: 'Resigned',
  5: 'Applied',
}

const statusColor: Record<typeof status[number], string> = {
  Current: 'primary',
  Professional: 'success',
  Rejected: 'error',
  Resigned: 'warning',
  Applied: 'info',
}

export default {
  data() {
    return {
      selectedFile: null as File | null,
      fileName: '',
      fileContent: '',
      totalProfit: {
        title: 'Total Profit',
        color: 'secondary',
        icon: 'mdi-poll',
        stats: '$25.6k',
        change: 42,
        subtitle: 'Weekly Project',
      },

      newProject : {
        title: 'New Project',
        color: 'primary',
        icon: 'mdi-briefcase-variant-outline',
        stats: '862',
        change: -18,
        subtitle: 'Yearly Project',
      },
      usreList: [
        {
          responsiveId: '',
          id: 95,
          uid: 'Edwina Ebsworth',
          description: 'Human Resources Assistant',
          email: 'eebsworth2m@sbwire.com',
          city: 'Puzi',
          start_date: '09/27/2018',
          salary: 19586.23,
          age: '27',
          experience: '2 Years',
          status: 1,
        },
        {
          responsiveId: '',
          id: 1,
          uid: 'Korrie O\'Crevy',
          description: 'Nuclear Power Engineer',
          email: 'kocrevy0@thetimes.co.uk',
          city: 'Krasnosilka',
          start_date: '09/23/2016',
          salary: 23896.35,
          age: '61',
          experience: '1 Year',
          status: 2,
        },
      ],
      headers: [
        'UID',
        'Pass',
        'Token',
        'Cookie',
        'Trạng thái',
      ],
      statistics : [
        {
          title: 'Live',
          stats: '0',
          icon: 'mdi-account-check-outline',
          color: 'success',
        },
        {
          title: 'Checkpoint',
          stats: '0',
          icon: 'mdi-account-alert-outline',
          color: 'warning',

        },
        {
          title: '2FA',
          stats: '0',
          icon: 'mdi-account-clock-outline',
          color: 'primary',
        },
        {
          title: 'Die/Lỗi',
          stats: '0',
          icon: 'mdi-account-cancel-outline',
          color: 'error',
        },
      ]
    };
  },
  methods: {
    handleFileChange(event: Event) {
      const inputElement = event.target as HTMLInputElement;
      const file = inputElement.files?.[0];

      if (file) {
        this.fileName = file.name;

        const reader = new FileReader();

        reader.onload = (event) => {
          // Đọc nội dung file khi tải lên hoàn tất
          this.fileContent = event.target?.result as string;
        };

        // Đọc file với kiểu dữ liệu là văn bản (text)
        reader.readAsText(file);
      }
    },
    openFileInput() {
      // Mở hộp thoại chọn file khi nút được click
      this.$refs.fileInput.click();
    },
  },
};


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
  return "Cấu hình Proxy/Dcom "
   + (proxies && isProxy.value  ? " => Số lượng: " + proxies.value.split('\n').filter(x=> x && x.trim()).length: "");
};

const fileContent = ref("");
const fileInput = ref("");

</script>

<template>
  <VRow class="match-height">
    <VCol
      cols="12"
      md="4"
    >
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
          <v-textarea rows="2" disabled="isProxy" label="IP:Port or IP:Port:user:pass"></v-textarea>
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
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
    <VCard>
    <VCardItem>
      <VCardTitle>Thống kê</VCardTitle>

      <template #append>
        <div class="me-n3">
        </div>
      </template>
    </VCardItem>

    <VCardText>
      <h6 class="text-sm font-weight-medium mb-12">
        <span>Chọn File tài khoản </span>
        <input
          ref="fileInput"
          type="file"
          accept=".txt"
          style="display: none"
          @change="handleFileUpload"
        />
        <span class="font-weight-regular ml-2"> <VBtn size="small" color="primary" @click="openFileInput"> Chọn File </VBtn></span>
        <span v-if="fileContent" class= "font-weight-regular ml-2">Tên file </span>
      </h6>

      <VRow>
        <VCol
          v-for="item in statistics"
          :key="item.title"
          cols="6"
          sm="3"
        >
          <div class="d-flex align-center">
            <div class="me-3">
              <VAvatar
                :color="item.color"
                rounded
                size="42"
                class="elevation-1"
              >
                <VIcon
                  size="24"
                  :icon="item.icon"
                />
              </VAvatar>
            </div>

            <div class="d-flex flex-column">
              <span class="text-caption">
                {{ item.title }}
              </span>
              <span class="text-h6">{{ item.stats }}</span>
            </div>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
    </VCol>

    <VCol cols="12">
      <VCard>
        <VTable
          
          :headers="headers"
          :items="usreList"
          item-key="uid"
          class="table-rounded"
          hide-default-footer
          disable-sort
          fixed-header
          height=500
        >
          <thead>
            <tr>
              <th
                v-for="header in headers"
                :key="header"
              >
                {{ header }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in data"
              :key="row.uid"
            >
              <!-- name -->

              <td>
                <div class="d-flex flex-column">
                  <h6 class="text-sm font-weight-medium">{{ row.uid }}</h6>
                  <span class="text-xs">{{ row.description }}</span>
                </div>
              </td>

              <td class="text-sm" v-text="row.email" />
              <td class="text-sm" v-text="row.start_date" />
              <td class="text-sm" v-text="`$${row.salary}`" />
              <!-- status -->
              <td>
                <VChip
                size="small"
                :color="statusColor[status[row.status]]"
                class="text-capitalize"
                >
                {{ status[row.status] }}
              </VChip>
            </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </VCol>
  </VRow>
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