import * as S from '@eyedea/syncano'
import {Connector} from './syncano'
import {TodoStoreModel} from './todo-store'

interface Args {
  node: string
  payload: string
}

class Endpoint extends S.Endpoint {
  async run(
    {data}: S.Core,
    {args}: S.Context<Args>
  ) {
    const store = TodoStoreModel.create()
    const connection = new Connector({
      appid: 'todos-app',
      modelName: 'todo-store',
      syncano: this.syncano,
      store,
    })
    await connection.start()

    this.logger.info(args)
    this.logger.info({store})
    const {uid} = JSON.parse(args.node)

    await data.todo
      .where('uid', uid)
      .delete()
  }
}

export default ctx => {
  ctx.meta.metadata = {
    inputs: {},
  }

  return new Endpoint(ctx)
}
