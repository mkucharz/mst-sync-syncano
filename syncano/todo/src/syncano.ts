import _ from 'lodash'
import * as crypto from 'crypto'
import * as S from '@eyedea/syncano'

import { applyAction, IAnyStateTreeNode, IJsonPatch, ISerializedActionCall } from "mobx-state-tree"
import { onAction } from "mobx-state-tree"

interface Transaction {
    id?: number
    entity: string
    appid: string
    action: string
    payload: string
    tid: string
}

interface ConnectorConstructor {
  appid: string
  modelName: string
  store: IAnyStateTreeNode
  syncano: S.Core
}

export class Connector {
    queue: Transaction[]
    applied: string[]
    transRegistry: Transaction[]
    appid: string
    entity: string
    store: IAnyStateTreeNode
    offline: boolean
    conflict: boolean
    applying: boolean
    syncano: S.Core
    applyingNow: any

  constructor ({appid, modelName, store, syncano}: ConnectorConstructor) {
    this.queue = []
    this.applied = []
    this.transRegistry = []
    this.appid = appid
    this.entity = modelName
    this.store = store
    this.syncano = syncano

    onAction(store, patch => this.patch(patch))
    // this.resolveConflict()
    // this.tryToFlush()
  }

  genTid () {
    return crypto.randomBytes(Math.ceil(5)).toString('hex').slice(0, 5)
  }

  start = this.resolveConflict

  async resolveConflict () {
    console.log('Resolve conflict')

    const transaction = this.getLastTransaction()
    const searchId = transaction ? transaction.id : undefined

    console.log('searchId', searchId)
    try {
      const list = await this.syncano.endpoint.post('sync-state/list', {
         entity: this.entity, appid: this.appid, lastId: searchId })
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
      await this.syncano.endpoint.get('sync-state/sync', params)
      console.log('synced:', params.tid)
      this.offline = false
      return true
    } catch (err) {
      console.log(err)
      if (err.message === 'Network Error') {
        console.log('Network Error')
        this.offline = true
      } else if (err.response && err.response.status === 409) {
        console.log('Conflict')
        this.conflict = true
        await this.resolveConflict()
      }
    }
  }

  apply (transaction: Transaction) {
    console.log('apply:', transaction)
    // this[transaction.action](JSON.parse(transaction.payload))
    this.applying = true
    this.applyingNow = transaction.tid

    const action: ISerializedActionCall = JSON.parse(transaction.payload)

    applyAction(this.store, action)

    this.applied.push(transaction.tid)
    this.applyingNow = null
    this.applying = false
    this.transRegistry.push(transaction)
  }

  // Patch is comming from MST
  patch (action: ISerializedActionCall) {
    if (this.applying) {
      console.log('NOT APPLYING!')
      return
    }

    console.log('Running action', action.name, action)

    const params = {
      entity: this.entity,
      appid: this.appid,
      action: action.name,
      payload: JSON.stringify(action.args),
      tid: this.genTid()
    }

    this.queue.push(params)
    // this[actionName](payload, event)
  }
}

