export interface WechatOptions {
  appid: string
  secret: string
}

export interface WechatJscode2sessionResponse {
  openId: string
  sessionKey: string
  unionId?: string
}

export interface WechatUserInfo {
  openId: string
  unionId?: string
  nickName: string
  gender: 0 | 1 | 2
  city: string
  province: string
  country: string
  avatarUrl: string
  watermark: {
    appid: string
    timestamp: number
  }
}
