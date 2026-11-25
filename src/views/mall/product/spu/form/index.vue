<template>
  <ContentWrap v-loading="formLoading">
    <el-card v-if="!isDetail" class="mb-16px" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">第三方商品引入（1688 / 网页爬虫）</span>
          <span class="text-12px text-gray-500">
            选择已配置的平台并输入商品链接或 ID，可一键抓取并回填到下方表单
          </span>
        </div>
      </template>
      <div class="flex flex-wrap items-center gap-12px">
        <el-select
          v-model="importForm.platformId"
          class="!w-240px"
          clearable
          placeholder="请选择货源平台配置"
        >
          <el-option
            v-for="item in platformList"
            :key="item.id"
            :label="`${item.name}（${item.fetchMode === 1 ? 'API' : '爬虫'}）`"
            :value="item.id"
          />
        </el-select>
        <el-input
          v-model="importForm.sourceUrl"
          class="!w-380px"
          clearable
          placeholder="请输入第三方商品链接（如 1688 商品 URL）或商品 ID"
        />
        <el-checkbox v-model="importForm.downloadImages">自动转存图片</el-checkbox>
        <el-button
          v-hasPermi="['product:spu:import', 'product:spu:create']"
          :loading="importLoading"
          type="primary"
          @click="handleImportPreview"
        >
          采集并填充
        </el-button>
      </div>
    </el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="基础设置" name="info">
        <InfoForm
          ref="infoRef"
          v-model:activeName="activeName"
          :is-detail="isDetail"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="价格库存" name="sku">
        <SkuForm
          ref="skuRef"
          v-model:activeName="activeName"
          :is-detail="isDetail"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="物流设置" name="delivery">
        <DeliveryForm
          ref="deliveryRef"
          v-model:activeName="activeName"
          :is-detail="isDetail"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="商品详情" name="description">
        <DescriptionForm
          ref="descriptionRef"
          v-model:activeName="activeName"
          :is-detail="isDetail"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="其它设置" name="other">
        <OtherForm
          ref="otherRef"
          v-model:activeName="activeName"
          :is-detail="isDetail"
          :propFormData="formData"
        />
      </el-tab-pane>
    </el-tabs>
    <el-form>
      <el-form-item style="float: right">
        <el-button v-if="!isDetail" :loading="formLoading" type="primary" @click="submitForm">
          保存
        </el-button>
        <el-button @click="close">返回</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { cloneDeep } from 'lodash-es'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ProductSpuApi from '@/api/mall/product/spu'
import * as SourcePlatformApi from '@/api/mall/product/sourcePlatform'
import InfoForm from './InfoForm.vue'
import DescriptionForm from './DescriptionForm.vue'
import OtherForm from './OtherForm.vue'
import SkuForm from './SkuForm.vue'
import DeliveryForm from './DeliveryForm.vue'
import { convertToInteger, floatToFixed2, formatToFraction } from '@/utils'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'ProductSpuAdd' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
const { params, name } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const importLoading = ref(false) // 第三方采集加载中
const platformList = ref<SourcePlatformApi.SourcePlatformSimpleVO[]>([]) // 启用的平台配置
const importForm = reactive({
  platformId: undefined as number | undefined,
  sourceUrl: '',
  downloadImages: false
})
const activeName = ref('info') // Tag 激活的窗口
const isDetail = ref(false) // 是否查看详情
const infoRef = ref() // 商品信息 Ref
const skuRef = ref() // 商品规格 Ref
const deliveryRef = ref() // 物流设置 Ref
const descriptionRef = ref() // 商品详情 Ref
const otherRef = ref() // 其他设置 Ref
// SPU 表单数据
const formData = ref<ProductSpuApi.Spu>({
  name: '', // 商品名称
  categoryId: undefined, // 商品分类
  keyword: '', // 关键字
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTypes: [], // 配送方式数组
  deliveryTemplateId: undefined, // 运费模版
  brandId: undefined, // 商品品牌
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: [
    {
      name: '', // SKU 名称，提交时会自动使用 SPU 名称
      price: 0, // 商品价格
      marketPrice: 0, // 市场价
      costPrice: 0, // 成本价
      barCode: '', // 商品条码
      picUrl: '', // 图片地址
      stock: 0, // 库存
      weight: 0, // 商品重量
      volume: 0, // 商品体积
      firstBrokeragePrice: 0, // 一级分销的佣金
      secondBrokeragePrice: 0 // 二级分销的佣金
    }
  ],
  description: '', // 商品详情
  sort: 0, // 商品排序
  giveIntegral: 0, // 赠送积分
  virtualSalesCount: 0, // 虚拟销量
  sourceType: 0, // 商品来源类型：0=自有，1=第三方
  sourcePlatformId: undefined,
  sourcePlatformCode: '',
  sourceProductId: '',
  sourceUrl: ''
})

/** 从第三方平台采集并回填表单 */
const handleImportPreview = async () => {
  if (!importForm.platformId) {
    message.warning('请先选择第三方平台配置')
    return
  }
  if (!importForm.sourceUrl?.trim()) {
    message.warning('请输入第三方商品 URL 或商品 ID')
    return
  }
  importLoading.value = true
  try {
    const res = await ProductSpuApi.importPreviewSpu({
      platformId: importForm.platformId,
      sourceUrl: importForm.sourceUrl.trim(),
      downloadImages: importForm.downloadImages
    })
    const convertedSkus = (res.skus || []).map((item) => ({
      ...item,
      price: formatToFraction(item.price || 0),
      marketPrice: formatToFraction(item.marketPrice || 0),
      costPrice: formatToFraction(item.costPrice || 0),
      firstBrokeragePrice: formatToFraction(item.firstBrokeragePrice || 0),
      secondBrokeragePrice: formatToFraction(item.secondBrokeragePrice || 0)
    }))
    formData.value = {
      ...formData.value,
      sourceType: res.sourceType ?? 1,
      sourcePlatformId: res.sourcePlatformId,
      sourcePlatformCode: res.sourcePlatformCode,
      sourceProductId: res.sourceProductId,
      sourceUrl: res.sourceUrl,
      name: res.name || formData.value.name,
      keyword: res.keyword || formData.value.keyword,
      introduction: res.introduction || formData.value.introduction,
      description: res.description || formData.value.description,
      picUrl: res.picUrl || formData.value.picUrl,
      sliderPicUrls: res.sliderPicUrls?.length ? res.sliderPicUrls : formData.value.sliderPicUrls,
      specType: Boolean(res.specType),
      skus: convertedSkus.length ? convertedSkus : formData.value.skus
    }
    if (res.duplicateSpuId) {
      message.warning(
        `采集成功！注意：系统已存在同来源商品「${res.duplicateSpuName}」(编号 ${res.duplicateSpuId})，请注意核对避免重复上架`
      )
    } else {
      message.success('采集成功并已填充表单，请核对商品分类、品牌和销售价格后保存')
    }
  } finally {
    importLoading.value = false
  }
}

/** 获得详情 */
const getDetail = async () => {
  if ('ProductSpuDetail' === name) {
    isDetail.value = true
  }
  const id = params.id as unknown as number
  if (id) {
    formLoading.value = true
    try {
      const res = (await ProductSpuApi.getSpu(id)) as ProductSpuApi.Spu
      res.skus?.forEach((item) => {
        if (isDetail.value) {
          item.price = floatToFixed2(item.price)
          item.marketPrice = floatToFixed2(item.marketPrice)
          item.costPrice = floatToFixed2(item.costPrice)
          item.firstBrokeragePrice = floatToFixed2(item.firstBrokeragePrice)
          item.secondBrokeragePrice = floatToFixed2(item.secondBrokeragePrice)
        } else {
          // 回显价格分转元
          item.price = formatToFraction(item.price)
          item.marketPrice = formatToFraction(item.marketPrice)
          item.costPrice = formatToFraction(item.costPrice)
          item.firstBrokeragePrice = formatToFraction(item.firstBrokeragePrice)
          item.secondBrokeragePrice = formatToFraction(item.secondBrokeragePrice)
        }
      })
      formData.value = res
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交按钮 */
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  try {
    // 校验各表单
    await unref(infoRef)?.validate()
    await unref(skuRef)?.validate()
    await unref(deliveryRef)?.validate()
    await unref(descriptionRef)?.validate()
    await unref(otherRef)?.validate()
    // 深拷贝一份, 这样最终 server 端不满足，不需要影响原始数据
    const deepCopyFormData = cloneDeep(unref(formData.value)) as ProductSpuApi.Spu
    // 校验商品名称不能为空（用于 SKU name）
    if (isEmpty(deepCopyFormData.name)) {
      message.error('商品名称不能为空')
      return
    }
    deepCopyFormData.skus!.forEach((item) => {
      // 给sku name赋值（使用商品名称作为 SKU 名称）
      item.name = deepCopyFormData.name
      // sku相关价格元转分
      item.price = convertToInteger(item.price)
      item.marketPrice = convertToInteger(item.marketPrice)
      item.costPrice = convertToInteger(item.costPrice)
      item.firstBrokeragePrice = convertToInteger(item.firstBrokeragePrice)
      item.secondBrokeragePrice = convertToInteger(item.secondBrokeragePrice)
    })
    // 处理轮播图列表
    const newSliderPicUrls: any[] = []
    deepCopyFormData.sliderPicUrls!.forEach((item: any) => {
      // 如果是前端选的图
      typeof item === 'object' ? newSliderPicUrls.push(item.url) : newSliderPicUrls.push(item)
    })
    deepCopyFormData.sliderPicUrls = newSliderPicUrls
    // 校验都通过后提交表单
    const data = deepCopyFormData as ProductSpuApi.Spu
    const id = params.id as unknown as number
    if (!id) {
      await ProductSpuApi.createSpu(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductSpuApi.updateSpu(data)
      message.success(t('common.updateSuccess'))
    }
    close()
  } finally {
    formLoading.value = false
  }
}

/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'ProductSpu' })
}

/** 初始化 */
onMounted(async () => {
  if (!isDetail.value) {
    platformList.value = await SourcePlatformApi.getSimpleSourcePlatformList()
  }
  await getDetail()
})
</script>
