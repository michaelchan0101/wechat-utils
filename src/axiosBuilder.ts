import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const RequestErrorHandler = function (err: any) {
  // print error for debugging
  throw new Error(err?.response?.data)
}

const createAxios = (options: AxiosRequestConfig, errorHandler: any): AxiosInstance => {
  const axiosBase = axios.create(options)
  axiosBase.interceptors.response.use((resp) => resp, errorHandler)
  return axiosBase
}

const WECHAT_PAY_HOST = 'https://api.weixin.qq.com'
const WECHAT_HOST = 'https://api.weixin.qq.com'

export default {
  createWechatPayAxios(): AxiosInstance {
    return createAxios(
      {
        baseURL: WECHAT_PAY_HOST,
        timeout: 10000,
      },
      RequestErrorHandler
    )
  },
  createWechatAxios(): AxiosInstance {
    return createAxios(
      {
        baseURL: WECHAT_HOST,
        timeout: 10000,
      },
      RequestErrorHandler
    )
  },
}
