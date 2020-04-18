import fs from 'fs'
import { AxiosInstance } from 'axios'
import {
  WechatPayOptions,
  WechatPayUnifiedOrderRequest,
  WechatPayUnifiedOrderResponse,
} from 'interfaces/wechatPay'
import WXPayUtil from './util'
import axiosBuilder from './axiosBuilder'

const WECHAT_PAY_HOST = 'https://api.mch.weixin.qq.com'
const WECHAT_PAY_SANDBOX_HOST = 'https://api.mch.weixin.qq.com'

export class WechatPay {
  private APPID: string
  private MCHID: string
  private SUBMCHID = ''
  private KEY: string
  private SIGN_TYPE: 'MD5' | 'HMAC-SHA256'
  private CERT_FILE_CONTENT: Buffer
  private CA_FILE_CONTENT: Buffer
  private request: AxiosInstance
  public constructor(options: WechatPayOptions) {
    this.APPID = options.appid
    this.MCHID = options.merchantId
    this.SUBMCHID = options.subMerchantId
    this.KEY = options.key
    this.SIGN_TYPE = options.signType || 'MD5'

    if (!fs.existsSync(options.certFilePath)) {
      throw Error(`cart file path(${options.certFilePath}) is not exist`)
    }
    if (!fs.existsSync(options.caFilePath)) {
      throw Error(`ca file path(${options.caFilePath}) is not exist`)
    }
    this.CERT_FILE_CONTENT = fs.readFileSync(options.certFilePath)
    this.CA_FILE_CONTENT = fs.readFileSync(options.caFilePath)
    this.request = axiosBuilder.createWechatPayAxios(
      options.useSandbox ? WECHAT_PAY_SANDBOX_HOST : WECHAT_PAY_HOST,
      options.timeout || 10000
    )
  }
  public fillRequestData(req: Record<string, any>): Record<string, any> {
    const clonedData: Record<string, any> = {
      ...req,
      appid: this.APPID,
      mch_id: this.MCHID,
      nonce_str: WXPayUtil.generateNonceStr(),
      sign_type: this.SIGN_TYPE,
    }
    if (this.SUBMCHID) {
      clonedData.sub_mch_id = this.SUBMCHID
    }
    clonedData.sign = WXPayUtil.generateSignature(clonedData, this.KEY, this.SIGN_TYPE)
    return clonedData
  }
  /**
   * HTTP(S) 请求，无证书
   */
  public async requestWithoutCert(
    url: string,
    reqData: any
  ): Promise<Record<string, any>> {
    const { data } = await this.request.post(url, {
      data: WXPayUtil.obj2xml(reqData),
      headers: { 'Content-Type': 'text/xml' },
    })
    const { xml: result } = WXPayUtil.xml2obj(data)
    if (result.return_code !== 'SUCCESS') {
      throw result
    }
    return result
  }
  /**
   * HTTP(S)请求，附带证书，适合申请退款等接口
   */
  public async requestWithCert(url: string, reqData: any): Promise<Record<string, any>> {
    const { data: content } = await this.request.post(url, {
      data: WXPayUtil.obj2xml(reqData),
      headers: { 'Content-Type': 'text/xml' },
      httpsAgent: {
        ca: this.CA_FILE_CONTENT,
        pfx: this.CERT_FILE_CONTENT,
        passphrase: this.MCHID,
      },
    })
    const { xml: result } = WXPayUtil.xml2obj(content)

    return result
  }
  /**
   * 统一下单
   */
  public async unifiedOrder(
    req: WechatPayUnifiedOrderRequest
  ): Promise<WechatPayUnifiedOrderResponse> {
    const result = await this.requestWithoutCert(
      '/pay/unifiedorder',
      this.fillRequestData(reqData)
    )
    if (result.return_code !== 'SUCCESS') {
      throw result.return_msg
    }
    if (result.result_code !== 'SUCCESS') {
      throw result.err_code_des
    }
    return {
      appId: result.appid,
      mchId: result.mch_id,
      deviceInfo: result.device_info,
      nonceStr: result.nonce_str,
      sign: result.sign,
      tradeType: result.trade_type,
      prepayId: result.prepay_id,
      codeUrl: result.code_url,
    }
  }
  public prepay(nonceStr: string) {
    const prepayInfo = {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr,
      package: `mch_id=${this.MCHID}`,
      signType: this.SIGN_TYPE,
    }
    return {
      ...prepayInfo,
      paySign: WXPayUtil.generateSignature(prepayInfo, this.KEY, this.SIGN_TYPE),
    }
  }
  public getPrepayInfo(nonceStr: string, prepayId: string) {
    const prepayInfo = {
      appId: this.APPID,
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr,
      package: `prepay_id=${prepayId}`,
      signType: this.SIGN_TYPE,
    }
    return {
      ...prepayInfo,
      paySign: WXPayUtil.generateSignature(prepayInfo, this.KEY, this.SIGN_TYPE),
    }
  }
  /**
   * 查询订单
   */
  public orderQuery(reqData: any): Promise<Record<string, any>> {
    return this.requestWithoutCert(`/pay/orderquery`, this.fillRequestData(reqData))
  }
  /**
   * 申请退款
   */
  public refund(reqData: any): Promise<Record<string, any>> {
    return this.requestWithCert('/secapi/pay/refund', this.fillRequestData(reqData))
  }
  /**
   * 退款查询
   */
  public refundQuery(reqData: any): Promise<Record<string, any>> {
    return this.requestWithoutCert(`/pay/refundQuery`, this.fillRequestData(reqData))
  }

  /**
   * 发放普通现金红包
   */
  public sendredpack(reqData: any): Promise<Record<string, any>> {
    const nReqData = {
      ...reqData,
      mch_id: this.MCHID,
      nonce_str: WXPayUtil.generateNonceStr(),
    }
    if (this.SUBMCHID) {
      nReqData.sub_mch_id = this.SUBMCHID
    }
    nReqData.sign = WXPayUtil.generateSignature(nReqData, this.KEY, 'MD5')
    return this.requestWithCert(`/mmpaymkttransfers/sendredpack`, nReqData)
  }
  /**
   * 企业付款到零钱
   */
  public promotionTransfer(reqData: any): Promise<Record<string, any>> {
    const nReqData: any = {
      ...reqData,
      mchid: this.MCHID,
      nonce_str: WXPayUtil.generateNonceStr(),
    }
    if (this.SUBMCHID) {
      nReqData.sub_mch_id = this.SUBMCHID
    }
    nReqData.sign = WXPayUtil.generateSignature(nReqData, this.KEY, 'MD5')
    return this.requestWithCert(`/mmpaymkttransfers/promotion/transfers`, nReqData)
  }
}
