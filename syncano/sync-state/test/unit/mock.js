export const mockSync = (params = {}) => {
  let mockS = {
    appid: `test_appid${Math.random()}`,
    entity: `test_entity${Math.random()}`,
    tid: `test_tid${Math.random()}`,
    action: 'addTodo',
    payload: "{'desc':'dsdssd'}",
    ...params
  }
  return mockS
}
export const mockLock = (params = {}) => {
  let mockL = {
    ...params
  }
  return mockL
}
