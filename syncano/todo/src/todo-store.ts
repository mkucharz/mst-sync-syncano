import {types} from 'mobx-state-tree'
import {TodoModel} from './todo'
// import { SHOW_ALL, SHOW_COMPLETED, SHOW_ACTIVE } from "../constants/TodoFilters"

// const filterType = types.union(...[SHOW_ALL, SHOW_COMPLETED, SHOW_ACTIVE].map(types.literal))

export const TodoStoreModel = types
    .model({
        todos: types.optional(types.array(TodoModel), []),
        // filter: types.optional(filterType, SHOW_ALL),
    })
