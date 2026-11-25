<template>
  <div class="account-preview"
    ><div v-for="(label, index) in labels" :key="label"
      ><Icon
        :icon="
          ['ep:wallet', 'ep:box', 'ep:chat-dot-square', 'ep:refresh-left', 'ep:tickets'][index]
        "
        :size="24"
        style="color: var(--shop-accent-text, currentColor)"
      /><span>{{ label }}</span></div
    ></div
  >
</template>
<script setup lang="ts">
import { UserOrderProperty } from './config'
defineOptions({ name: 'UserOrder' })
defineProps<{ property: UserOrderProperty }>()
const labels = ['待付款', '待收货', '待评价', '售后单', '全部订单']
</script>
<style scoped>
.account-preview {
  display: flex;
  justify-content: space-around;
  padding: 22px 0;
  min-height: 80px;
  box-sizing: border-box;
}
.account-preview > div {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-direction: column;
  font-size: 11px;
}
.account-preview img {
  height: 24px;
  width: 24px;
}
</style>
