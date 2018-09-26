import * as S from '@eyedea/syncano'
import crypto from 'crypto'

interface Args {
  appid: string
  entity: string
  action: string
  payload: string
  tid: string
  secret: boolean
  latestTid: string
  fromSocket: boolean
  syncObject: boolean
}

class Endpoint extends S.Endpoint {
  async run(
    {data, channel, response}: S.Core,
    {args, meta}: S.Context<Args>
  ) {
    const {user} = meta
    const {
      appid,
      entity,
      action,
      payload,
      tid,
      secret = false,
      latestTid = null,
      fromSocket,
      syncObject = false,
    } = args

    const transactionParams = {
      appid,
      entity,
      action,
      payload,
      tid,
      secret,
      latestTid,
      fromSocket,
      syncObject,
    }

    this.logger.info('New transaction', transactionParams)

    let lock
    try {
      lock = await this.syncano.data.lock.create({
        lockID: `${appid}-${entity}`,
        appid,
        entity,
        latestTid: tid,
      })
    } catch (err) {
      lock = await this.syncano.data.lock.where('lockID', `${appid}-${entity}`).first()
    }

    // let query = this.syncano.data.lock
    //   .where('appid', appid)
    //   .where('entity', entity)
    //
    // const userId = user ? user.id : null
    //
    // if (secret === true && userId === null) {
    //   throw new Error('If creating a secret object you must be logged in')
    // }
    // if (userId !== null && secret === true) {
    //   query = query.where('user', userId)
    // }

    // let lock = await query.list()
    // if (lock.length === 0) {
    //   // Create new lock if it doesn't exist
    //   let lockParams = {
    //     appid,
    //     entity,
    //     latestTid: tid,
    //   }
    //   if (secret === true) {
    //     lockParams = {...lockParams, user: userId}
    //   }
    //   await this.syncano.data.lock.create(lockParams)
    //   lock = await query.first()
    // }
    // // lock = lock[0]

    if (latestTid === null && lock.latestTid !== tid) {
      throw new Error('Please provide last id')
    }

    // Throw error if you are trying to apply patch with mismatched `latestTid`
    this.logger.debug('Transaction matching')
    this.logger.debug(latestTid, lock.latestTid)
    if (latestTid !== null && lock.latestTid !== latestTid) {
      throw new Error('Transaction id mismatch')
    }

    // Update lock ID
    await this.syncano.data.lock.update(lock.id, {
      expected_revision: lock.revision,
      latestTid: tid,
    })

    let params = {
      appid,
      entity,
      action,
      payload,
      tid,
      syncObject,
    }

    // if secret is true make this user owned object
    if (secret === true) {
      params = {
        ...params,
        user: userId,
      }
    }

    const createdTransaction = await this.syncano.data.transaction.create(params)
    const messagesString = secret === true && userId !== null
      ? `user_websocket.${appid}-${entity}.${userId}`
      : `websocket.${appid}-${entity}`

    this.syncano.channel.publish(messagesString,
      {appid, entity, action, payload, syncObject, tid, id: createdTransaction.id, latestTid})

    // const transPayload = JSON.parse(args.payload)
    // if (transPayload.syncObject && !fromSocket) {
    //   // event.emit(`${entity}.${action}`, {payload, latestTid: tid})
    //   const params = {
    //     entity: entity,
    //     appid: 'app',
    //     action: action,
    //     tid: crypto.randomBytes(Math.ceil(5)).toString('hex').slice(0, 5),
    //     latestTid: tid,
    //     fromSocket: true,
    //     syncObject: true
    //   }
    //   const args = transPayload.args
    //   try {
    //     const {temp} = await socket.get('openweathermap/get-temperature', {city: args.city})
    //     params.payload = JSON.stringify({args, data: {temp}, state: 'ready', syncObject: transPayload.syncObject})
    //   } catch (err) {
    //     console.log(err, err.data.message)
    //     params.payload =
    // JSON.stringify({args, data: {}, state: 'error', error: err.data.message, syncObject: transPayload.syncObject})
    //   }
    //   console.log(params)
    //   await createTransaction(params)
    // }
    // return response.json(createdTransaction)
  }

  endpointDidCatch(err: Error) {
    this.logger.error(err)
    this.syncano.response.json({message: err.message}, 409)
  }
}

export default ctx => new Endpoint(ctx)