<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="配置名称" prop="name">
        <el-input v-model="formData.name" placeholder="例如：1688 开放平台 / 1688 网页爬虫" />
      </el-form-item>
      <el-form-item label="所属平台" prop="platformCode">
        <el-select
          v-model="formData.platformCode"
          allow-create
          class="w-100%"
          filterable
          placeholder="请选择或输入平台标识（如 1688、generic）"
        >
          <el-option label="1688 批发 (1688)" value="1688" />
          <el-option label="通用网页/自定义 (generic)" value="generic" />
        </el-select>
      </el-form-item>
      <el-form-item label="采集方式" prop="fetchMode">
        <el-radio-group v-model="formData.fetchMode">
          <el-radio :value="1">API 接口</el-radio>
          <el-radio :value="2">网页爬虫</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="平台 URL" prop="baseUrl">
        <el-input
          v-model="formData.baseUrl"
          :placeholder="
            formData.fetchMode === 1
              ? '请输入 API 网关地址，如 https://gw.open.1688.com/openapi'
              : '请输入平台站点 URL，如 https://detail.1688.com'
          "
        />
      </el-form-item>

      <!-- API 授权配置 -->
      <template v-if="formData.fetchMode === 1">
        <el-form-item label="AppKey" prop="appKey">
          <el-input v-model="formData.appKey" placeholder="请输入平台 AppKey" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="appSecret">
          <el-input
            v-model="formData.appSecret"
            placeholder="请输入 AppSecret（编辑时不修改脱敏内容将保留原值）"
            show-password
          />
        </el-form-item>
        <el-form-item label="AccessToken" prop="accessToken">
          <el-input
            v-model="formData.accessToken"
            placeholder="请输入授权 AccessToken（可选）"
            show-password
          />
        </el-form-item>
      </template>

      <!-- 爬虫配置 -->
      <template v-else>
        <el-form-item label="登录 Cookie" prop="cookie">
          <el-input
            v-model="formData.cookie"
            :rows="3"
            placeholder="若目标站点需要登录态或防风控，可在此填入 Cookie"
            type="textarea"
          />
        </el-form-item>
      </template>

      <el-form-item label="扩展配置 JSON" prop="extraConfig">
        <el-input
          v-model="formData.extraConfig"
          :rows="4"
          :placeholder="
            formData.fetchMode === 1
              ? '可选 JSON，例如：{&quot;adapterCode&quot;:&quot;alibaba_1688_api&quot;,&quot;httpMethod&quot;:&quot;GET&quot;,&quot;endpointPath&quot;:&quot;/product&quot;}'
              : '可选 JSON，例如：{&quot;titleSelector&quot;:&quot;h1&quot;,&quot;priceSelector&quot;:&quot;.price&quot;,&quot;descSelector&quot;:&quot;.detail&quot;}'
          "
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as SourcePlatformApi from '@/api/mall/product/sourcePlatform'

defineOptions({ name: 'SourcePlatformForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const createInitialFormData = (): SourcePlatformApi.SourcePlatformVO => ({
  id: undefined,
  name: '',
  platformCode: '1688',
  fetchMode: 1,
  baseUrl: '',
  appKey: '',
  appSecret: '',
  accessToken: '',
  cookie: '',
  extraConfig: '',
  status: CommonStatusEnum.ENABLE,
  sort: 0,
  remark: ''
})

const formData = ref<SourcePlatformApi.SourcePlatformVO>(createInitialFormData())

const formRules = reactive({
  name: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  platformCode: [{ required: true, message: '所属平台不能为空', trigger: 'change' }],
  fetchMode: [{ required: true, message: '采集方式不能为空', trigger: 'change' }],
  baseUrl: [{ required: true, message: '平台 URL 不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  formData.value = createInitialFormData()
  formRef.value?.resetFields()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await SourcePlatformApi.getSourcePlatform(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await SourcePlatformApi.createSourcePlatform(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await SourcePlatformApi.updateSourcePlatform(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
