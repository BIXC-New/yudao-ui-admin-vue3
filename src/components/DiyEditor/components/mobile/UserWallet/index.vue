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
import { UserWalletProperty } from './config'
defineOptions({ name: 'UserWallet' })
defineProps<{ property: UserWalletProperty }>()
const labels = ['账户余额', '积分', '优惠券', '我的钱包']
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
