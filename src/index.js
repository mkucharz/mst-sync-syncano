import React from "react"
import { render } from "react-dom"
import Syncano from "./Syncano"
// import { connectReduxDevtools } from "mst-middlewares"
import { onSnapshot } from "mobx-state-tree"
import "todomvc-app-css/index.css"

import App from "./components/App"
import {TodoStore} from "./stores/todo-store"

const localStorageKey = "mst-todomvc-example"

const initialState = localStorage.getItem(localStorageKey)
    ? JSON.parse(localStorage.getItem(localStorageKey))
    : {
          todos: [
              // {
              //     text: "learn Mobx",
              //     completed: false,
              //     id: 9999
              // },
              // {
              //     text: "learn MST",
              //     completed: false,
              //     id: 1
              // }
          ]
      }


console.log('initialState', initialState)
let store = TodoStore.create(initialState)
// let snapshotListener

function createTodoStore(snapshot) {
    // clean up snapshot listener
    // if (snapshotListener) snapshotListener()
    // kill old store to prevent accidental use and run clean up hooks
    // if (store) destroy(store)

    // create new one
    // store = TodoStore.create(snapshot)
    store = TodoStore.create({todos: [
    //   {
    //     text: "learn Mobx",
    //     completed: false
    // }
    ]})
    // connect devtools
    // connectReduxDevtools(require("remotedev"), store)
    // connect local storage
    onSnapshot(store, snapshot =>
        localStorage.setItem(localStorageKey, JSON.stringify(snapshot))
    )

    return store
}

function renderApp(App, store) {

    // const syncedTodoStore = new Syncano('sync-test', 'todos-app', 'todo-store', store)
    new Syncano('sync-test', 'todos-app', 'todo-store', store)

    render(<App store={store} />, document.getElementById("root"))
}

// Initial render
renderApp(App, createTodoStore(initialState))

// // Connect HMR
// if (module.hot) {
//     module.hot.accept(["./models/todos"], () => {
//         // Store definition changed, recreate a new one from old state
//         renderApp(App, createTodoStore(getSnapshot(store)))
//     })
//
//     module.hot.accept(["./components/App"], () => {
//         // Componenent definition changed, re-render app
//         renderApp(App, store)
//     })
// }
