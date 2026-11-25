<template>
  <div class="tab-bar" :style="themeStyles">
    <div
      class="tab-bar-bg"
      :style="{
        background: followTheme
          ? 'var(--ui-BG)'
          : property.style.bgType === 'color'
            ? property.style.bgColor
            : `url(${property.style.bgImg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat'
      }"
    >
      <div v-for="(item, index) in property.items" :key="index" class="tab-bar-item">
        <Icon
          v-if="followTheme && getThemeIcon(item.iconUrl)"
          :icon="iconMap[getThemeIcon(item.iconUrl)]"
          :size="24"
          :style="{ color: index === 0 ? 'var(--shop-accent-text)' : 'var(--ui-TC-2)' }"
        />
        <el-image v-else :src="index === 0 ? item.activeIconUrl : item.iconUrl">
          <template #error>
            <div class="h-full w-full flex items-center justify-center">
              <Icon icon="ep:picture" />
            </div>
          </template>
        </el-image>
        <span
          :style="{
            color: followTheme
              ? index === 0
                ? 'var(--shop-accent-text)'
                : 'var(--ui-TC-2)'
              : index === 0
                ? property.style.activeColor
                : property.style.color
          }"
        >
          {{ item.text }}
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { TabBarProperty } from './config'
import { getThemeStyles, getThemeIcon } from '@/components/DiyEditor/theme'

/** 页面底部导航栏 */
defineOptions({ name: 'TabBar' })

const props = defineProps<{ property: TabBarProperty }>()
const followTheme = computed(() => props.property.themeConfig?.followTheme !== false)
const themeStyles = computed(() =>
  followTheme.value
    ? getThemeStyles(
        props.property.theme,
        props.property.themeConfig,
        (props.property as TabBarProperty & { previewBackground?: string }).previewBackground
      )
    : {}
)
const iconMap: Record<string, string> = {
  home: 'ep:house',
  list: 'ep:grid',
  cart: 'ep:shopping-cart',
  person: 'ep:user'
}
</script>
<style lang="scss" scoped>
.tab-bar {
  z-index: 2;
  width: 100%;

  .tab-bar-bg {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    min-height: 56px;
    box-sizing: border-box;
    padding: 6px 12px;

    .tab-bar-item {
      display: flex;
      width: 100%;
      min-width: 0;
      font-size: 12px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      :deep(img),
      .el-icon {
        width: 26px;
        height: 26px;
        border-radius: 4px;
        flex: 0 0 22px;
      }

      span {
        max-width: 100%;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 16px;
      }
    }
  }
}
</style>
