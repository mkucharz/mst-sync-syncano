import {getRoot} from 'mobx-state-tree'
import {TodoModel} from '../models/todo'

export const Todo = TodoModel
  .named('Todo')
  .actions(self => ({
      remove() {
          getRoot(self).removeTodo(self)
      },
      edit(text) {
          self.text = text
      },
      complete() {
          self.completed = !self.completed
      }
  }))