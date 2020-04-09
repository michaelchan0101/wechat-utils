import crypto from 'crypto'
import axiosBuilder from './axiosBuilder'
import { WechatOptions, WechatJscode2sessionResponse } from './interfaces/wechat'

const fetch = axiosBuilder.createWechatAxios()

export class Wechat {
  private appid: string
  private secret: string
  public constructor(options: WechatOptions) {
    const { appid, secret } = options
    this.appid = appid
    this.secret = secret
  }
  public async jscode2session(
    code: string,
    grantType = 'authorization_code'
  ): Promise<WechatJscode2sessionResponse> {
    const { data }: any = await fetch.get(`/sns/jscode2session`, {
      params: {
        appid: this.appid,
        secret: this.secret,
        js_code: code,
        grant_type: grantType,
      },
    })
    if (data.errcode !== 0) {
      throw { errcode: data.errcode, errmsg: data.errmsg }
    } else {
      return {
        openId: data.openid,
        sessionKey: data.session_key,
        unionId: data.unionid,
      }
    }
  }
  public decryptUserInfo(
    sessionKey: string,
    encryptedData: string,
    iv: string
  ): Record<string, any> {
    // base64 decode
    const sessionKeyBuf = Buffer.from(sessionKey, 'base64')
    const encryptedBuf = Buffer.from(encryptedData, 'base64')
    const ivBuf = Buffer.from(iv, 'base64')
    let decoded: Record<string, any>
    try {
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuf, ivBuf)
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true)
      let decodedStr = decipher.update(encryptedBuf, 'binary', 'utf8')
      decodedStr += decipher.final('utf8')
      decoded = JSON.parse(decodedStr)
    } catch (err) {
      throw new Error('Illegal Buffer')
    }
    if (decoded.watermark.appid !== this.appid) {
      throw new Error('Wrong Watermark')
    }

    return decoded
  }
}
