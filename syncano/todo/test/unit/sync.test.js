/* global describe it */

import {run} from '@syncano/test'
import meta from './meta'
import {mockSync} from './mock'
import {sync, lock, user} from './utils'

describe('sync', function () {
  it('create', async function () {
    const sync = mockSync()
    let res = await run('sync', {args: sync, meta})

    expect(res).hasProperty('code', 200)
    expect(res).hasProperty('mimetype', 'application/json')
    expect(res.data).hasProperty('appid', sync.appid)
    expect(res.data).hasProperty('tid', sync.tid)
    expect(res.data).hasProperty('entity', sync.entity)
  })

  it('create user object', async function () {
    const sync = mockSync({secret: true})
    const userObject = await user()
    let res = await run('sync', {args: sync, meta: {...meta, user: userObject}})

    expect(res).hasProperty('code', 200)
    expect(res).hasProperty('mimetype', 'application/json')
    expect(res.data).hasProperty('user', userObject.id)
  })

  it('create user object and not logged in', async function () {
    const userObject = await user()
    const syncObject = await sync({user: userObject.id, secret: true})

    await lock({
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid,
      user: userObject.id
    })

    let sync2 = mockSync()
    sync2 = {
      ...sync2,
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid,
      secret: true
    }

    const res = await run('sync', {args: sync2, meta: {...meta}})

    expect(res).hasProperty('code', 409)
    expect(res).hasProperty('mimetype', 'application/json')
  })

  it('create and update', async function () {
    const syncObject = await sync()
    await lock({
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid
    })
    let sync2 = mockSync()
    sync2 = {
      ...sync2,
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid
    }

    const res = await run('sync', {args: sync2, meta})

    expect(res).hasProperty('code', 200)
    expect(res).hasProperty('mimetype', 'application/json')
    expect(res.data).hasProperty('appid', sync2.appid)
    expect(res.data).hasProperty('tid', sync2.tid)
    expect(res.data).hasProperty('entity', sync2.entity)
  })

  it('create and cant update because wrong latestTid', async () => {
    const syncObject = await sync()

    await lock({
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid
    })

    let sync2 = mockSync()
    sync2 = {
      ...sync2,
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: sync2.tid
    }

    let res = await run('sync', {args: sync2, meta})

    expect(res).hasProperty('code', 409)
    expect(res).hasProperty('mimetype', 'application/json')
  })

  it('create and cant update because no latestTid', async () => {
    const syncObject = await sync()

    await lock({
      appid: syncObject.appid,
      entity: syncObject.entity,
      latestTid: syncObject.tid
    })

    let sync2 = mockSync()
    sync2 = {
      ...sync2,
      appid: syncObject.appid,
      entity: syncObject.entity
    }

    let res = await run('sync', {args: sync2, meta})
    expect(res).hasProperty('code', 409)
    expect(res).hasProperty('mimetype', 'application/json')
  })
})
