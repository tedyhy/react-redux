import { bindActionCreators } from 'redux'
import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

// mapDispatchToProps 是 function 时，调用 wrapMapToPropsFunc 方法。
/**
 * function mapDispatchToProps(dispatch) {
 *   return {
 *     toastAction: bindActionCreators(toastAction, dispatch),
 *     addressAction: bindActionCreators(addressAction, dispatch),
 *     realNameAction: bindActionCreators(realNameAction, dispatch),
 *   }
 * }
 * export default connect(mapStateToProps, mapDispatchToProps)(Step); 
 */
export function whenMapDispatchToPropsIsFunction(mapDispatchToProps) {
  return (typeof mapDispatchToProps === 'function')
    ? wrapMapToPropsFunc(mapDispatchToProps, 'mapDispatchToProps')
    : undefined
}

// mapDispatchToProps 是 null 时，调用 wrapMapToPropsConstant 方法。
/**
 * const mapDispatchToProps = null
 * export default connect(mapStateToProps, mapDispatchToProps)(Step); 
 */
export function whenMapDispatchToPropsIsMissing(mapDispatchToProps) {
  return (!mapDispatchToProps)
    ? wrapMapToPropsConstant(dispatch => ({ dispatch }))
    : undefined
}

// mapDispatchToProps 是 object 时，调用 wrapMapToPropsConstant 方法返回一个 handler，否则返回 undefined。
/**
 * 如果传入的 mapDispatchToProps 是 object，那么里面所有的 function 都会被认为是一个 Redux 的 action creator。
 * 同时，一个新对象会被造出并合并到组件的 props 中。这个新对象会包含 mapDispatchToProps 中同样的 function 名，
 * 但是每一个 action creator 都被 dispatch 包裹，所以就可以直接调用。
 * 
 * const mapDispatchToProps = {
 *   toastAction, // action creator
 *   addressAction, // action creator
 *   realNameAction, // action creator
 * }
 * export default connect(mapStateToProps, mapDispatchToProps)(Step); 
 */
export function whenMapDispatchToPropsIsObject(mapDispatchToProps) {
  return (mapDispatchToProps && typeof mapDispatchToProps === 'object')
    // 在 mapDispatchToProps 对象里，调用了 redux 的 bindActionCreators 方法，
    // 所以最后生成的都是绑定过 dispatch 的 actions，这也就是为什么在被 connect 包裹后的组件中，
    // 直接调用 this.props.action 就可以通知 redux，而不是 dispatch(this.props.action())。
    ? wrapMapToPropsConstant(dispatch => bindActionCreators(mapDispatchToProps, dispatch))
    : undefined
}

// 被 match 从右向左遍历执行，依次条件过滤
export default [
  whenMapDispatchToPropsIsFunction,
  whenMapDispatchToPropsIsMissing,
  whenMapDispatchToPropsIsObject
]
