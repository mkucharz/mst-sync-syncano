import * as S from '@eyedea/syncano'

interface Args {
  appid: string
  entity: string
  secret: boolean
  lastId: string
}

class Endpoint extends S.Endpoint {
  async run(
    {data, response}: S.Core,
    {args, meta}: S.Context<Args>
  ) {
    try {
      const {user} = meta
      const {appid = null, entity = null, secret = false, lastId = 0} = args
      const userId = user ? user.id : null

      console.log("XX", appid, entity, secret, lastId || 0)
      let query = data.transaction.where('appid', appid).where('entity', entity).where('id', 'gt', lastId || 0)

      if (userId !== null && secret === true) {
        query = query.where('user', userId)
      }

      let transactions = await query.list()
      transactions = transactions.filter(t => {
        if (t.user !== null) {
          return t.user === userId
        }

        return true
      })

      return response.json(transactions)
    } catch (err) {
      console.log(err)

      return response.json({message: err.message}, 400)
    }
  }
}

export default ctx => new Endpoint(ctx)
