/* global WebSocket */
import { applyPatch } from "mobx-state-tree"
import _ from 'lodash'
import crypto from 'crypto'
import { onPatch, resolvePath } from "mobx-state-tree"
import SyncanoClient from '@syncano/client'

class Syncano {
  constructor (instanceName, appid, modelName, store) {
    this.queue = []
    this.applied = []
    this.transRegistry = []
    this.appid = appid
    this.entity = modelName
    this.store = store

    this.s = new SyncanoClient(instanceName, {apiVersion: 'v3'})
    this.instanceName = instanceName

    this.resolveConflict()
    this.startWS()
    this.tryToFlush()

    onPatch(store, patch => this.patch(patch))
  }

  genTid () {
    return crypto.randomBytes(Math.ceil(5)).toString('hex').slice(0, 5)
  }

  async resolveConflict () {
    console.log('Resolve conflict')

    let searchId = 0
    try {
      searchId = this.getLastTransaction().id
    } catch (err) {}

    console.log('searchId', searchId)
    try {
      const list = await this.s.post('sync-state/list', { entity: this.entity, appid: this.appid, lastId: searchId })
      if (list.length > 0) {
        this.transRegistry = list
        list.forEach(async item => {
          if (this.applied.indexOf(item.tid) === -1) {
            await this.apply(item)
          }
        })
      }
    } catch (err) {
      console.log(err)
    }
  }

  startWS () {
    console.log('startWS')
    this.ws = new WebSocket(`wss://${this.instanceName}.syncano.space/sync-state/websocket/?transport=websocket&room=${this.appid}-${this.entity}`)
    this.ws.onopen = () => {
      console.log('OPEN')
      this.offline = false
    }
    this.ws.onclose = () => {
      console.log('WS closed')
      this.offline = true
      this.startWS()
      this.resolveConflict()
    }
    this.ws.onmessage = async (msg) => {
      const transaction = JSON.parse(msg.data).payload
      // const actionPayload = JSON.parse(transaction.payload)

      console.log('comming:', transaction.tid, 'processed?:', 'applied?:', this.applied.indexOf(transaction.tid), 'queue?:', _.find(this.queue, {tid: transaction.tid} || false))

      // If it is already applied
      if (this.applied.indexOf(transaction.tid) > -1) {
        console.log('not processing this transaction - applied')
        return
      }

      // If it is in a queue
      if (_.find(this.queue, {tid: transaction.tid})) {
        console.log('not processing this transaction - in queue')
        return
      }

      console.log('Trans id:', transaction.tid, transaction.latestTid)
      if (transaction.latestTid === this.getLastTid()) {
        this.apply(transaction)
      } else {
        this.resolveConflict()
      }
    }
  }

  async tryToFlush () {
    if (this.queue.length > 0) {
      const nextTrans = this.queue[0]
      if (this.applied.indexOf(nextTrans.tid) === -1) {
        this.applied.push(nextTrans.tid)

        console.log('tryToFlush')
        const success = await this.transSync(nextTrans)
        if (success) {
          console.log('Success', nextTrans.tid)
          this.transRegistry.push(nextTrans)
          this.queue.shift()
        } else {
          const appliedTransIndex = this.applied.indexOf(nextTrans.tid)
          this.applied.splice(appliedTransIndex, 1)
        }
      }
    }
    setTimeout(await this.tryToFlush.bind(this), this.offline ? 2000 : 2000)
  }

  getLastTransaction () {
    return this.transRegistry.length > 0 ? this.transRegistry[this.transRegistry.length - 1] : null
  }

  getLastTid () {
    const lastTransaction = this.getLastTransaction()
    
    return lastTransaction ? lastTransaction.tid : null
  }

  async transSync (params) {
    console.log('transSync')
    try {
      console.log('latestTid', this.getLastTid())
      if (this.getLastTid()) {
        params.latestTid = this.getLastTid()
      }
      await this.s.get('sync-state/sync', params)
      console.log('synced:', params.tid)
      this.offline = false
      return true
    } catch (err) {
      console.log(err)
      if (err.message === 'Network Error') {
        console.log('Network Error')
        this.offline = true
        this.ws.close()
      } else if (err.response && err.response.status === 409) {
        console.log('Conflict')
        this.conflict = true
        // this.ws.close()
        await this.resolveConflict()
      }
    }
  }

  apply (transaction) {
    console.log('apply:', transaction)
    // this[transaction.action](JSON.parse(transaction.payload))
    this.applying = true
    applyPatch(this.store, JSON.parse(transaction.payload))
    this.applied.push(transaction.tid)
    this.applying = false
    this.transRegistry.push(transaction)
  }

  // Patch is comming from MST
  patch (payload) {
    if (this.applying) {
      console.log('NOT APPLYING!')
      return
    }

    const actionName = payload.op
    console.log('Running action', actionName, payload)

    console.log('XXX', this.store.todos.toJSON())

    const params = {
      entity: this.entity,
      appid: this.appid,
      action: actionName,
      payload: JSON.stringify(payload),
      node: resolvePath(this.store, payload.path).toJSON(),
      tid: this.genTid()
    }

    this.queue.push(params)
    // this[actionName](payload, event)
  }
}

export default Syncano
