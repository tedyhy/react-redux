import connectAdvanced from '../components/connectAdvanced'
import shallowEqual from '../utils/shallowEqual'
import defaultMapDispatchToPropsFactories from './mapDispatchToProps'
import defaultMapStateToPropsFactories from './mapStateToProps'
import defaultMergePropsFactories from './mergeProps'
import defaultSelectorFactory from './selectorFactory'

/*
  connect is a facade over connectAdvanced. It turns its args into a compatible
  selectorFactory, which has the signature:

    (dispatch, options) => (nextState, nextOwnProps) => nextFinalProps
  
  connect passes its args to connectAdvanced as options, which will in turn pass them to
  selectorFactory each time a Connect component instance is instantiated or hot reloaded.

  selectorFactory returns a final props selector from its mapStateToProps,
  mapStateToPropsFactories, mapDispatchToProps, mapDispatchToPropsFactories, mergeProps,
  mergePropsFactories, and pure args.

  The resulting final props selector is called by the Connect component instance whenever
  it receives new props or store state.

  connect 在每一次 state 变化之后，用新的 store tree 重新渲染组件。
  mapStateToProps：参数为整个 store tree，返回值为需要 merge 进 props 的部分 state。
  mapDispatchToProps：参数为 store.dispatch，返回值为需要 merge 进 props 的部分 action。
  mergeProps：将前面两个函数的返回值，加上自定义的属性，合并到一起，挂到容器组件的 this props 上。
  options：是否开启优化，默认值为 true。

  例子：
  Step.js
  
  import {connect} from 'react-redux';
  import {bindActionCreators} from 'redux';

  function mapStateToProps(state, ownProps) {
    return {
      address: state.get('address'),
      realName: state.get('realName'),
    };
  }

  function mapDispatchToProps(dispatch) {
    return {
      toastAction: bindActionCreators(toastAction, dispatch),
      addressAction: bindActionCreators(addressAction, dispatch),
      realNameAction: bindActionCreators(realNameAction, dispatch),
    }
  }

  export default connect(mapStateToProps, mapDispatchToProps)(Step);

  connect是个可以执行两次的柯里化函数，
  第一次传入的参数相当于一系列的定制化东西（mapStateToProps, mapDispatchToProps, mergeProps, options），
  第二次传入的是你要连接的React组件，然后返回一个新的React组件。
 */


// 将数组 factories 中函数从右向左遍历，依次校验过滤。一旦其中一个函数执行后有值，则停止遍历，返回值。
// 如果数组 factories 中的函数都不符合，则抛出错误。
function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) return result
  }

  return (dispatch, options) => {
    throw new Error(`Invalid value of type ${typeof arg} for ${name} argument when connecting component ${options.wrappedComponentName}.`)
  }
}

// 全等校验方法
function strictEqual(a, b) { return a === b }

// createConnect with default args builds the 'official' connect behavior. Calling it with
// different options opens up some testing and extensibility scenarios
// connect 生成器
// 参数：
// connectHOC === connectAdvanced
// mapStateToPropsFactories === defaultMapStateToPropsFactories
// mapDispatchToPropsFactories === defaultMapDispatchToPropsFactories
// mergePropsFactories === defaultMergePropsFactories
// selectorFactory === defaultSelectorFactory
export function createConnect({
  connectHOC = connectAdvanced,
  mapStateToPropsFactories = defaultMapStateToPropsFactories,
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  mergePropsFactories = defaultMergePropsFactories,
  selectorFactory = defaultSelectorFactory
} = {}) {
  // 如：export default connect(mapStateToProps, mapDispatchToProps)(Step);
  return function connect(
    // 默认4个参数
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    {
      pure = true,
      areStatesEqual = strictEqual,
      areOwnPropsEqual = shallowEqual,
      areStatePropsEqual = shallowEqual,
      areMergedPropsEqual = shallowEqual,
      ...extraOptions
    } = {}
  ) {
    const initMapStateToProps = match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps')
    const initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps')
    const initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps')

    // connectHOC 创建组件 Connect，并将传参 WrappedComponent 组件上的静态非 React 属性拷贝到自身。
    return connectHOC(selectorFactory, {
      // used in error messages
      // 被用在错误信息中输出
      methodName: 'connect',

      // used to compute Connect's displayName from the wrapped component's displayName.
      // 用于从包装组件的 displayName 中计算得出 Connect 的 displayName。
      getDisplayName: name => `Connect(${name})`,

      // if mapStateToProps is falsy, the Connect component doesn't subscribe to store state changes
      shouldHandleStateChanges: Boolean(mapStateToProps),

      // passed through to selectorFactory
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,
      pure,
      areStatesEqual,
      areOwnPropsEqual,
      areStatePropsEqual,
      areMergedPropsEqual,

      // any extra options args can override defaults of connect or connectAdvanced
      ...extraOptions
    })
  }
}

export default createConnect()
