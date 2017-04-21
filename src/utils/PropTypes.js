// Runtime type checking for React props and similar objects
// 参考 https://github.com/reactjs/prop-types
// import {PropTypes} from 'react'; 属于 react 子模块。
import PropTypes from 'prop-types'

// 创建两个自定义属性类型校验集合
export const subscriptionShape = PropTypes.shape({
  trySubscribe: PropTypes.func.isRequired,
  tryUnsubscribe: PropTypes.func.isRequired,
  notifyNestedSubs: PropTypes.func.isRequired,
  isSubscribed: PropTypes.func.isRequired,
})

export const storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired
})
