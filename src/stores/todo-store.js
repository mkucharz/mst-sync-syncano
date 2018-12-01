import {types, destroy} from 'mobx-state-tree'
import { SHOW_ALL, SHOW_COMPLETED, SHOW_ACTIVE } from "../constants/TodoFilters"
import uuidv1 from 'uuid/v1'
import {Todo} from './todo'

const generateId = () => {
  return uuidv1()
}

const TODO_FILTERS = {
    [SHOW_ALL]: () => true,
    [SHOW_ACTIVE]: todo => !todo.completed,
    [SHOW_COMPLETED]: todo => todo.completed
}
const filterType = types.union(...[SHOW_ALL, SHOW_COMPLETED, SHOW_ACTIVE].map(types.literal))

export const TodoStore = types
    .model('TodoStore', {
        todos: types.optional(types.array(Todo), []),
        filter: types.optional(filterType, SHOW_ALL)
    })
    .views(self => ({
        get completedCount() {
            return self.todos.reduce((count, todo) => (todo.completed ? count + 1 : count), 0)
        },
    }))
    .views(self => ({
        get activeCount() {
            return self.todos.length - self.completedCount
        },
        get filteredTodos() {
            return self.todos.filter(TODO_FILTERS[self.filter])
        }
    }))
    .actions(self => ({
        // actions
        addTodo(text) {
            // const id = self.todos.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1
            const uid = generateId()

            self.todos.unshift({
                uid,
                text
            })
        },
        removeTodo(todo) {
          console.log('ZZZ', todo)
          destroy(todo)
        },
        completeAll() {
            const areAllMarked = self.todos.every(todo => todo.completed)
            self.todos.forEach(todo => (todo.completed = !areAllMarked))
        },
        clearCompleted() {
            self.todos.replace(self.todos.filter(todo => todo.completed === false))
        },
        setFilter(filter) {
            self.filter = filter
        }
    }))

// export interface TodoStore extends Instance<typeof TodoStore> {}