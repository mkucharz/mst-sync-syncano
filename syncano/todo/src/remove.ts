import * as S from '@eyedea/syncano'
import {Connector} from './syncano'
import {types, destroy, flow, getRoot} from 'mobx-state-tree'
// import {TodoStoreModel} from './todo-store'
// import {TodoModel} from './todo'
import uuidv1 from 'uuid/v1'

const generateId = () => {
  return uuidv1()
}

class Endpoint extends S.Endpoint {
  async run(
    {data, response}: S.Core,
    {args, meta}: S.Context<Args>
  ) {

    const lastTid = args.latestTid

    const TodoModel = types
      .model({
          text: types.maybeNull(types.string),
          completed: false,
          uid: types.identifier,
      })
      .actions(self => ({
        remove: flow(function* (actionArgs: any) {
          console.log('XXX remove')
          console.log('XXX', self.text)
          getRoot(self).removeTodo(self)
          // if (connection.applyingNow === args.latestTid) {
          //   console.warn('Deleting!', {actionArgs})
            // yield data.todo.delete(actionArgs)
            
          // }
        }),
      }))

    const TodoStore = types
      .model('TodoStore', {
        todos: types.optional(types.array(TodoModel), []),
      })
      .actions(self => ({
        removeTodo: (todo) => {
          console.log('destroy')
          destroy(todo)
        },
        addTodo: flow(function* (actionArgs: any) {
          const uid = generateId()

          self.todos.unshift({
              uid,
              text: actionArgs,
          })
          if (connection.applyingNow === args.latestTid) {
            console.warn('Adding!', {actionArgs})
            yield data.todo.create({text: actionArgs})
          }
        }),
      }))

    const store = TodoStore.create()
    const connection = new Connector({
      appid: 'todos-app',
      modelName: 'todo-store',
      store,
      syncano: this.syncano,
    })
    await connection.start()
  }
}

export default ctx => {
  ctx.meta.metadata = {
    inputs: {},
  }

  return new Endpoint(ctx)
}
