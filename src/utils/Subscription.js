// encapsulates the subscription logic for connecting a component to the redux store, as
// well as nesting subscriptions of descendant components, so that we can ensure the
// ancestor components re-render before descendants
// 封装订阅 store tree 改变事件逻辑，用于将组件连接到 redux store，
// 以及嵌套后代组件的订阅，以便我们确保祖先组件在后代组件前重新 render。

const CLEARED = null
const nullListeners = { notify() {} }

function createListenerCollection() {
  // the current/next pattern is copied from redux's createStore code.
  // TODO: refactor+expose that code to be reusable here?
  let current = []
  let next = []

  return {
    // 清理变量，避免内存泄漏
    clear() {
      next = CLEARED
      current = CLEARED
    },

    // 通知事件监听集合 handler 遍历执行
    notify() {
      const listeners = current = next
      for (let i = 0; i < listeners.length; i++) {
        listeners[i]()
      }
    },

    subscribe(listener) {
      let isSubscribed = true
      if (next === current) next = current.slice()
      // 监听器入栈
      next.push(listener)

      return function unsubscribe() {
        if (!isSubscribed || current === CLEARED) return
        isSubscribed = false

        if (next === current) next = current.slice()
        // 将该监听器从栈中移除
        next.splice(next.indexOf(listener), 1)
      }
    }
  }
}

// 定义订阅类
export default class Subscription {
  constructor(store, parentSub, onStateChange) {
    // 保存 store tree
    this.store = store
    // 保存父订阅器实例
    this.parentSub = parentSub
    // state change 事件 handler
    this.onStateChange = onStateChange
    // 用于保存（基于 store.subscribe）订阅后返回的取消订阅 handler。
    this.unsubscribe = null
    // 初始化监听器实例
    this.listeners = nullListeners
  }

  // 用于将子监听器嵌入当前订阅器 Sub 实例中
  addNestedSub(listener) {
    this.trySubscribe()
    return this.listeners.subscribe(listener)
  }

  // 通知事件监听集合 handler 遍历执行
  notifyNestedSubs() {
    this.listeners.notify()
  }

  // 是否被订阅了
  isSubscribed() {
    return Boolean(this.unsubscribe)
  }

  // 试图订阅
  trySubscribe() {
    if (!this.unsubscribe) {
      // 如果存在父订阅器，将当前订阅器 Sub 嵌套入父订阅器实例中，供父订阅器统一调用执行。
      // 如果没有父订阅器，调用 store.subscribe 订阅事件。
      this.unsubscribe = this.parentSub
        ? this.parentSub.addNestedSub(this.onStateChange)
        : this.store.subscribe(this.onStateChange)
 
      // 创建监听器 handler 集合
      this.listeners = createListenerCollection()
    }
  }

  // 试图取消订阅
  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe()
      // 清理订阅痕迹
      this.unsubscribe = null
      this.listeners.clear()
      this.listeners = nullListeners
    }
  }
}
