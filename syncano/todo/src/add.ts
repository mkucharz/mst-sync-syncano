import * as S from '@eyedea/syncano'
import {Connector} from './syncano'
import {TodoStoreModel} from './todo-store'

interface Args {
  payload: string
}

class Endpoint extends S.Endpoint {
  async run(
    {data, endpoint}: S.Core,
    {args, meta}: S.Context<Args>
  ) {
    const store = TodoStoreModel.create()
    const connection = new Connector({
      appid: 'todos-app', 
      modelName: 'todo-store', 
      store, 
      syncano: this.syncano,
    })
    await connection.start()

    const payload = JSON.parse(args.payload)

    await data.todo.create(payload.value)
  }
}

export default ctx => {
  ctx.meta.metadata = {
    inputs: {}
  }

  return new Endpoint(ctx)
}
