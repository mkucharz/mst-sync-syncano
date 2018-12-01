import * as S from '@eyedea/syncano'

class Endpoint extends S.Endpoint {
  async run(
    {data}: S.Core
  ) {
    await data.todo.delete()
    await data.lock.delete()
    await data.transaction.delete()
  }
}

export default ctx => new Endpoint(ctx)
