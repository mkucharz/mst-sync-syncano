/* global describe it expect */

import {run} from '@syncano/test'
import meta from './meta'
import {sync, user} from './utils'
let syncMock

describe('list', function () {
  it('list transactions', async function () {
    syncMock = await sync()
    const {appid, tid, entity} = syncMock
    let res = await run('list', {args: {appid, entity}, meta})

    expect(res).hasProperty('code', 200)
    expect(res).hasProperty('mimetype', 'application/json')
    expect(res.data[0]).hasProperty('appid', appid)
    expect(res.data[0]).hasProperty('tid', tid)
    expect(res.data[0]).hasProperty('entity', entity)
  })

  it('list user transactions', async function () {
    const userObject = await user()
    const syncObject = await sync({secret: true, user: userObject.id})
    let res = await run('list', {
      args: {
        appid: syncObject.appid,
        entity: syncObject.entity,
        secret: true
      },
      meta: {...meta, user: userObject}
    })
    expect(res).hasProperty('code', 200)
    expect(res).hasProperty('mimetype', 'application/json')
  })

  it('incorrect', async function () {
    let res = await run('list', {args: {}, meta})

    expect(res).hasProperty('code', 400)
    expect(res).hasProperty('mimetype', 'application/json')
  })
})
