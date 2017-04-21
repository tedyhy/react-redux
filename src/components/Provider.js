import { Component, Children } from 'react'
// Runtime type checking for React props and similar objects
// 参考 https://github.com/reactjs/prop-types
// 为什么不用 React.propTypes，参考 https://facebook.github.io/react/docs/typechecking-with-proptypes.html
import PropTypes from 'prop-types'
// 自定义属性类型校验集合 shape
import { storeShape, subscriptionShape } from '../utils/PropTypes'
// 警告日志输出
import warning from '../utils/warning'

let didWarnAboutReceivingStore = false
function warnAboutReceivingStore() {
  // 只提示一次
  if (didWarnAboutReceivingStore) {
    return
  }
  didWarnAboutReceivingStore = true

  // <Provider> 组件不支持即时更新 store，你看到这个警告，很可能是因为你更新到
  // Redux 2.x 和 React Redux 2.x，它们不再支持热加载 reducers。
  // 参考 https://github.com/reactjs/react-redux/releases/tag/v2.0.0 作为迁移说明。
  /**
   * Before:
   * import { createStore } from 'redux';
   * import rootReducer from '../reducers/index';
   *
   * export default function configureStore(initialState) {
   *   return createStore(rootReducer, initialState);
   * }
   *
   * After:
   * import { createStore } from 'redux';
   * import rootReducer from '../reducers/index';
   *
   * export default function configureStore(initialState) {
   *   const store = createStore(rootReducer, initialState);
   *   if (module.hot) {
   *     // Enable Webpack hot module replacement for reducers
   *     module.hot.accept('../reducers', () => {
   *       const nextRootReducer = require('../reducers/index');
   *       store.replaceReducer(nextRootReducer);
   *     });
   *   }
   *   return store;
   * }
   */
  warning(
    '<Provider> does not support changing `store` on the fly. ' +
    'It is most likely that you see this error because you updated to ' +
    'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' +
    'automatically. See https://github.com/reactjs/react-redux/releases/' +
    'tag/v2.0.0 for the migration instructions.'
  )
}

// 定义一个容器类组件 Provider，继承自 Component
export default class Provider extends Component {
  // 与 Provider.childContextTypes = {} 配合使用，向下传递数据到组件树中的任意子组件。
  // 子组件都可以通过 context 取到 store。
  getChildContext() {
    return { store: this.store, storeSubscription: null }
  }

  constructor(props, context) {
    super(props, context)
    // 从 this.props 上获取属性 store
    /**
     * 例子：
     * <Provider store={store}>
     *   <Router history={history}>
     *     {_routes}
     *   </Router>
     * </Provider>
     */
    this.store = props.store
  }

  render() {
    // Children.only 返回 this.props.children 中仅有的子级。
    // 即：render 其中第一个子组件，并且要求组件的第一级子组件只有一个。否则抛出异常。
    return Children.only(this.props.children)
  }
}

// 非线上环境下重写 componentWillReceiveProps 生命周期方法
// 如果原 store !== nextProps.store 则抛出警告信息，如果做了 module.hot 热加载配置就不会警告了。
if (process.env.NODE_ENV !== 'production') {
  Provider.prototype.componentWillReceiveProps = function (nextProps) {
    const { store } = this
    const { store: nextStore } = nextProps

    if (store !== nextStore) {
      warnAboutReceivingStore()
    }
  }
}

Provider.propTypes = {
  // 校验 store 【必须】
  store: storeShape.isRequired,
  // 校验子级元素 children 【必须】
  children: PropTypes.element.isRequired
}
// 通过添加 childContextTypes 和 getChildContext() 到 Provider 组件，
// React 会自动向下传递数据到组件树中的任意子组件，子组件可以通过定义 contextTypes 访问 context 中的数据。
Provider.childContextTypes = {
  store: storeShape.isRequired,
  storeSubscription: subscriptionShape
}
// displayName属性用于组件调试时输出显示，JSX自动设置该值，可以理解为调试时显示的组件名。
Provider.displayName = 'Provider'
