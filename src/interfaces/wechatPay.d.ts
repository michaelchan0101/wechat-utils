export interface WechatPayOptions {
  appid: string
  merchantId: string
  subMerchantId?: string
  signType?: 'MD5' | 'HMAC-SHA256'
  key: string
  certFilePath: string
  caFilePath: string
  secret: string
  useSandbox?: boolean
  timeout?: number
}

export interface WechatPayUnifiedOrderRequest {
  body: string
  total_fee: number
  fee_type?: 'CNY'
  notify_url: string
  openid?: string
  trade_type: 'JSAPI' | 'NATIVE' | 'APP'
  spbill_create_ip: string
  out_trade_no: string
  goods_tag?: string
  product_id?: string
  limit_pay?: 'no_credit'
  receipt?: 'Y'
  scene_info?: string
  time_start?: number
  time_expire?: number
  detail?: string
  attach?: string
  scene_info?: string
}

export interface WechatPayUnifiedOrderResponse {
  appId: string
  mchId: string
  deviceInfo?: string
  nonceStr: string
  sign: string
  tradeType: string
  prepayId: string
  codeUrl?: string
}
