// https://github.com/node-weixin/node-weixin-util

import crypto from 'crypto'
import xml2js from 'xml2js'
import randomstring from 'randomstring'
import fastXmlParser from 'fast-xml-parser'

function isNumeric(n: any): boolean {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

/**
 * object 转换成 XML 字符串
 */
function obj2xml(obj: Record<string, any>): string {
  const builder = new xml2js.Builder({ cdata: true, rootName: 'xml' })
  return builder.buildObject(obj)
}
function getSortKeys(keys: Array<string>): Array<string> {
  for (let i = 0; i < keys.length; i++) {
    let isSort = true
    for (let j = 0; j < keys.length - i; j++) {
      if (keys[j] < keys[j - 1]) {
        const tmp = keys[j]
        keys[j] = keys[j - 1]
        keys[j - 1] = tmp
        isSort = false
      }
    }
    if (isSort) {
      break
    }
  }
  return keys
}
export default {
  isNumeric,
  obj2xml,
  getNonce(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const pos = chars.length
    return Array(32)
      .fill('')
      .map(() => chars.charAt(Math.floor(Math.random() * pos)))
      .join('')
  },
  /**
   * Marshalling object keys to be sorted alphabetically and then translated to url parameters
   */
  marshall(params = {}): string {
    const keys = Object.keys(params).sort()
    return keys
      .filter((key) => !!params[key])
      .map((key) => `${key}=${params[key]}`)
      .join('&')
  },
  toXml(params: Record<string, any>): string {
    const lines = []
    lines.push('<xml>')
    for (const k in params) {
      if (!params[k]) {
        continue
      }
      if (isNumeric(params[k])) {
        lines.push('<' + k + '>' + params[k] + '</' + k + '>')
      } else {
        lines.push('<' + k + '><![CDATA[' + params[k] + ']]></' + k + '>')
      }
    }
    lines.push('</xml>')
    return lines.join('')
  },
  toParam(params = {}): string {
    return Object.keys(params)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
  },
  /**
   * XML 字符串转换成 object
   */
  xml2obj(xmlData: string): Record<string, any> {
    return fastXmlParser.parse(xmlData)
  },
  /**
   * 生成签名
   */
  generateSignature(data: Record<string, any>, key: string, signType = 'MD5'): string {
    if (signType !== 'MD5' && signType !== 'HMAC-SHA256') {
      throw new Error('Invalid signType: ' + signType)
    }
    let combineStr = ''
    const ks = getSortKeys(Object.keys(data))
    for (let i = 0; i < ks.length; ++i) {
      const k = ks[i]
      if (k !== 'sign' && data[k]) {
        const v = '' + data[k]
        if (v.length > 0) {
          combineStr += `${k}=${v}&`
        }
      }
    }
    if (combineStr.length === 0) {
      throw new Error('There is no data to generate signature')
    } else {
      combineStr += `key=${key}`
      if (signType === 'MD5') {
        return this.md5(combineStr)
      } else if (signType === 'HMAC-SHA256') {
        return this.hmacsha256(combineStr, key)
      } else {
        throw new Error('Invalid signType: ' + signType)
      }
    }
  },
  /**
   * 验证签名
   */
  isSignatureValid(data: Record<string, any>, key: string, signType = 'MD5'): boolean {
    if (data === null || typeof data !== 'object') {
      return false
    } else if (!data['sign']) {
      return false
    } else {
      return data['sign'] === this.generateSignature(data, key, signType)
    }
  },

  /**
   * 带有签名的 XML 数据
   */
  generateSignedXml(data: Record<string, any>, key: string, signType: string): string {
    const clonedDataObj = JSON.parse(JSON.stringify(data))
    clonedDataObj['sign'] = this.generateSignature(data, key, signType)
    return obj2xml(clonedDataObj)
  },

  /**
   * 生成随机字符串
   */
  generateNonceStr(): string {
    return randomstring.generate()
  },

  /**
   * 得到 MD5 签名结果
   *
   * @param {string} source
   * @returns {string}
   */
  md5(source: string): string {
    return crypto.createHash('md5').update(source).digest('hex').toUpperCase()
  },

  /**
   * 得到 HMAC-SHA256 签名结果
   */
  hmacsha256(source: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(source, 'utf8')
      .digest('hex')
      .toUpperCase()
  },
}
