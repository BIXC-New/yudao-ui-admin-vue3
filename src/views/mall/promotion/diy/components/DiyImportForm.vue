<template>
  <Dialog
    v-model="visible"
    :title="kind === 'template' ? '导入装修模板' : '导入装修页面'"
    width="560px"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="loading">
      <el-form-item label="名称" prop="name"
        ><el-input v-model="form.name" maxlength="64" show-word-limit
      /></el-form-item>
      <el-form-item label="主题包">
        <el-upload
          ref="uploadRef"
          accept=".zip"
          :auto-upload="false"
          :limit="1"
          :on-change="onChange"
          :on-remove="() => (file = undefined)"
          :disabled="loading"
        >
          <el-button type="primary" plain>选择 ZIP</el-button>
          <template #tip
            ><div class="el-upload__tip"
              >ZIP ≤ 10MB，最多 100 张图片，支持 PNG、JPEG、GIF、WebP、静态 SVG。</div
            ></template
          >
        </el-upload>
      </el-form-item>
      <el-alert type="info" :closable="false" title="新增独立记录，不自动启用或覆盖原装修。">
        纯图片包按文件名排序生成图片组件；可在根目录加入 diy.json 指定布局与主题，图片通过
        asset://assets/文件名 引用。导入素材使用系统当前文件存储配置。
      </el-alert>
    </el-form>
    <template #footer
      ><el-button :disabled="loading" @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="loading" @click="submit">导入</el-button></template
    >
  </Dialog>
</template>
<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import request from '@/config/axios'
const props = defineProps<{ kind: 'template' | 'page' }>()
const emit = defineEmits<{ success: [id: number] }>()
const message = useMessage()
const visible = ref(false)
const loading = ref(false)
const formRef = ref()
const uploadRef = ref()
const file = ref<File>()
const form = reactive({ name: '' })
const rules = {
  name: [{ required: true, whitespace: true, message: '请输入名称', trigger: 'blur' }]
}
const open = () => {
  form.name = ''
  file.value = undefined
  visible.value = true
  nextTick(() => {
    uploadRef.value?.clearFiles()
    formRef.value?.clearValidate()
  })
}
defineExpose({ open })
const onChange = (selected: UploadFile) => {
  file.value = selected.raw
}
const submit = async () => {
  await formRef.value.validate()
  if (!file.value || !file.value.name.toLowerCase().endsWith('.zip'))
    return message.warning('请选择 ZIP 文件')
  if (file.value.size > 10 * 1024 * 1024) return message.warning('ZIP 不能超过 10MB')
  const data = new FormData()
  data.append('name', form.name.trim())
  data.append('file', file.value)
  loading.value = true
  try {
    const result = await request.upload<{
      data: { id: number; assets: { path: string; url: string }[] }
    }>({ url: '/promotion/diy-' + props.kind + '/import', data })
    message.success('导入成功，' + result.data.assets.length + ' 张素材已归档到文件管理')
    visible.value = false
    emit('success', result.data.id)
  } finally {
    loading.value = false
  }
}
</script>
