import verifyPlainObject from '../utils/verifyPlainObject'

// 主要针对 map(State|Dispatch)ToProps 是 object|null 的情况，
// 把这个对象进行包装，生成 (dispatch, options) => ()=>dispatchedActions 的方法，并添加 dependsOnOwnProps 属性。
export function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)

    function constantSelector() { return constant }
    constantSelector.dependsOnOwnProps = false 
    return constantSelector
  }
}

// dependsOnOwnProps is used by createMapToPropsProxy to determine whether to pass props as args
// to the mapToProps function being wrapped. It is also used by makePurePropsSelector to determine
// whether mapToProps needs to be invoked when props have changed.
// dependsOnOwnProps 属性并不是对外的属性，而是代码内部逻辑使用的，会在多个方法中用到，
// 这个属性主要是针对 connect 的两个参数 mapStateToProps, mapDispatchToProps。
// mapStateToProps 可以是 function|null, mapDispatchToProps 可以是function|object|null。
// 如果是 function，当定义的时候，可以选择是否传入 ownProps 对象，比如：function mapStateToProps(state, ownProps) {}，
// 这就说明这个 function 的返回结果可能是基于 ownProps 的，所以每次 ownProps 发生改变的时候，都需要调用这个方法进行更新。
// 所以 dependsOnOwnProps 就是当 ownProps 更新的时候，用来判断是否需要重新调用对应方法获取新的结果。
// 
// A length of one signals that mapToProps does not depend on props from the parent component.
// A length of zero is assumed to mean mapToProps is getting args via arguments or ...args and
// therefore not reporting its length accurately..
// 
// @param mapToProps 为函数。
// mapToProps.dependsOnOwnProps 为 Boolean。
// 判断 map(State|Dispatch)ToProps 方法是否需要 ownProps。
// 返回值决定了在 props 更新的时候，是否要调用 map(State|Dispatch)ToProps 方法进行更新。
export function getDependsOnOwnProps(mapToProps) {
  // 如果 mapToProps.dependsOnOwnProps 不为 null 和 undefined，将其转换为布尔值。
  return (mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined)
    ? Boolean(mapToProps.dependsOnOwnProps)
    // 通过判断方法 mapToProps 的参数个数来判断是否需要 ownProps，
    // 当 mapToProps.length !== 1 的时候，就是需要。反之，不需要。
    : mapToProps.length !== 1
}

// Used by whenMapStateToPropsIsFunction and whenMapDispatchToPropsIsFunction,
// this function wraps mapToProps in a proxy function which does several things:
// 
//  * Detects whether the mapToProps function being called depends on props, which
//    is used by selectorFactory to decide if it should reinvoke on props changes.
//    
//  * On first call, handles mapToProps if returns another function, and treats that
//    new function as the true mapToProps for subsequent calls.
//    
//  * On first call, verifies the first result is a plain object, in order to warn
//    the developer that their mapToProps function is not returning a valid result.
//  
//  @param mapToProps 函数，map(State|Dispatch)ToProps。
//  @param methodName mapToProps函数名称，map(State|Dispatch)ToProps。
// 主要是针对 map(State|Dispatch)ToProps 是 function 的情况。
export function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch)
    }

    // allow detectFactoryAndVerify to get ownProps
    // 允许 detectFactoryAndVerify 方法获取 ownProps
    proxy.dependsOnOwnProps = true

    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps
      // 初始化时根据 mapToProps 来判断是否需要 ownProps
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      // 先获取 mapToProps 的返回值
      let props = proxy(stateOrDispatch, ownProps)

      // 如果返回值是 function，那么符合文档中说的特殊情况
      if (typeof props === 'function') {
        // 把这个 props 当作真正的 mapToProps
        proxy.mapToProps = props
        // 根据新的 props 方法来更新是否需要 ownProps
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        // 获取最终结果
        props = proxy(stateOrDispatch, ownProps)
      }

      // 如果是非线上环境，判断结果的类型
      if (process.env.NODE_ENV !== 'production') 
        verifyPlainObject(props, displayName, methodName)

      return props
    }

    return proxy
  }
}
