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
  const mockAccessToken = 'token'
  const mockExpiredAt = Date.now() + 7200000
  test('getAccessToken() - OK', async () => {
    // mock response - mainly to test response
    nock($rootURL)
      .get(`/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`)
      .reply(200, {
        errcode: 0,
        access_token: mockAccessToken,
        expires_in: 7200,
      })
    const { accessToken, expiredAt } = await wechat.getAccessToken()
    expect(accessToken).toEqual(mockAccessToken)
    expect(expiredAt).toBeGreaterThanOrEqual(mockExpiredAt)

    const {
      accessToken: accessToken2,
      expiredAt: expiredAt2,
    } = await wechat.getAccessToken()
    expect(accessToken2).toEqual(accessToken)
    expect(expiredAt2).toEqual(expiredAt)
  })
})
