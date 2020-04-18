import nock from 'nock'
import { Wechat } from '../src/wechat'

const $rootURL = 'https://api.weixin.qq.com'
const APPID = 'xxx'
const SECRET = '<secret>'

const wechat = new Wechat({
  appid: APPID,
  secret: SECRET,
})

afterAll(async () => {
  nock.restore()
})

describe('Wechat', () => {
  describe('getAccessToken()', () => {
    const mockAccessToken = 'token'
    const mockExpiredAt = Date.now() + 7200000
    test('should successfully', async () => {
      nock($rootURL)
        .get(
          `/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
        )
        .reply(200, {
          errcode: 0,
          access_token: mockAccessToken,
          expires_in: 7200,
        })
      const { accessToken, expiredAt } = await wechat.getAccessToken()
      expect(accessToken).toEqual(mockAccessToken)
      expect(expiredAt).toBeGreaterThanOrEqual(mockExpiredAt)
    })
    test('should failure', async () => {
      const response = {
        errcode: 1,
        errmsg: 'errmsg',
      }
      nock($rootURL)
        .get(
          `/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
        )
        .reply(200, response)

      await expect(wechat.getAccessToken()).rejects.toEqual(response)
    })
  })
})
