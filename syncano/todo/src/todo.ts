import {types} from 'mobx-state-tree'

export const TodoModel = types
    .model({
        text: types.maybeNull(types.string),
        completed: false,
        uid: types.identifier,
    })
    