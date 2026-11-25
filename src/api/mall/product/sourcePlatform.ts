import request from '@/config/axios'

export interface SourcePlatformVO {
  id?: number
  name: string
  platformCode: string
  fetchMode: number
  baseUrl: string
  appKey?: string
  appSecret?: string
  accessToken?: string
  refreshToken?: string
  tokenExpireTime?: Date
  cookie?: string
  extraConfig?: string
  status: number
  sort?: number
  remark?: string
  createTime?: Date
}

export interface SourcePlatformSimpleVO {
  id: number
  name: string
  platformCode: string
  fetchMode: number
  baseUrl?: string
}

// 查询第三方货源平台配置分页
export const getSourcePlatformPage = (params: PageParam & {
  name?: string
  platformCode?: string
  fetchMode?: number
  status?: number
}) => {
  return request.get({ url: '/product/source-platform/page', params })
}

// 查询第三方货源平台配置详情
export const getSourcePlatform = (id: number) => {
  return request.get({ url: `/product/source-platform/get?id=${id}` })
}

// 新增第三方货源平台配置
export const createSourcePlatform = (data: SourcePlatformVO) => {
  return request.post({ url: '/product/source-platform/create', data })
}

// 修改第三方货源平台配置
export const updateSourcePlatform = (data: SourcePlatformVO) => {
  return request.put({ url: '/product/source-platform/update', data })
}

// 删除第三方货源平台配置
export const deleteSourcePlatform = (id: number) => {
  return request.delete({ url: `/product/source-platform/delete?id=${id}` })
}

// 获取已启用的第三方货源平台精简列表
export const getSimpleSourcePlatformList = (): Promise<SourcePlatformSimpleVO[]> => {
  return request.get({ url: '/product/source-platform/list-all-simple' })
}
