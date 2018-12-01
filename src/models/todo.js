import {types} from 'mobx-state-tree'

export const TodoModel = types
    .model({
        uid: types.identifier,
        text: types.maybeNull(types.string),
        completed: false,
    })