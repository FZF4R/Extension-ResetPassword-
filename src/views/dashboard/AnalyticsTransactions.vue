<script setup lang="ts">
const statistics = [
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
</script>

<template>
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
        <span class="font-weight-regular ml-2"> <VBtn size="small" color="primary"> Chọn File </VBtn></span>
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
</template>
