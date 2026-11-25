<!-- 商品中心 - 第三方货源平台配置 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="82px"
    >
      <el-form-item label="配置名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-220px"
          clearable
          placeholder="请输入配置名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属平台" prop="platformCode">
        <el-select
          v-model="queryParams.platformCode"
          class="!w-180px"
          clearable
          placeholder="请选择平台"
        >
          <el-option
            v-for="item in platformOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="采集方式" prop="fetchMode">
        <el-select
          v-model="queryParams.fetchMode"
          class="!w-160px"
          clearable
          placeholder="请选择采集方式"
        >
          <el-option label="API 接口" :value="1" />
          <el-option label="网页爬虫" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-140px" clearable placeholder="请选择状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="['product:source-platform:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="编号" prop="id" width="80" />
      <el-table-column label="配置名称" min-width="160" prop="name" />
      <el-table-column align="center" label="所属平台" prop="platformCode" width="120">
        <template #default="{ row }">
          <el-tag>{{ formatPlatformLabel(row.platformCode) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="采集方式" prop="fetchMode" width="110">
        <template #default="{ row }">
          <el-tag :type="row.fetchMode === 1 ? 'success' : 'warning'">
            {{ row.fetchMode === 1 ? 'API 接口' : '网页爬虫' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平台 URL" min-width="240" prop="baseUrl" show-overflow-tooltip />
      <el-table-column label="AppKey / 授权" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.fetchMode === 1">{{ row.appKey || (row.accessToken ? '已配置Token' : '-') }}</span>
          <span v-else>{{ row.cookie ? '已配置Cookie' : '无Cookie抓取' }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" prop="status" width="90">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="排序" prop="sort" width="80" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['product:source-platform:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['product:source-platform:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗 -->
  <SourcePlatformForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as SourcePlatformApi from '@/api/mall/product/sourcePlatform'
import SourcePlatformForm from './SourcePlatformForm.vue'

defineOptions({ name: 'ProductSourcePlatform' })

const message = useMessage()
const { t } = useI18n()

const platformOptions = [
  { label: '1688 批发', value: '1688' },
  { label: '通用网页/其他', value: 'generic' }
]

const loading = ref(false)
const list = ref<SourcePlatformApi.SourcePlatformVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  platformCode: undefined as string | undefined,
  fetchMode: undefined as number | undefined,
  status: undefined as number | undefined
})
const queryFormRef = ref()
const formRef = ref()

const formatPlatformLabel = (code?: string) => {
  return platformOptions.find((item) => item.value === code)?.label || code || '-'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await SourcePlatformApi.getSourcePlatformPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await SourcePlatformApi.deleteSourcePlatform(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
