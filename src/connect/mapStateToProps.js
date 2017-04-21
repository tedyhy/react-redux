import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

// 如果传参 mapStateToProps 是函数，通过 wrapMapToPropsFunc 包装返回，
// 否则，返回 undefined。
export function whenMapStateToPropsIsFunction(mapStateToProps) {
  return (typeof mapStateToProps === 'function')
    ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    : undefined
}

// 如果没有传参 mapStateToProps，通过 wrapMapToPropsConstant 包装返回，
// 否则，返回 undefined。
export function whenMapStateToPropsIsMissing(mapStateToProps) {
  return (!mapStateToProps)
    ? wrapMapToPropsConstant(() => ({}))
    : undefined
}

// 被 match 从右向左遍历执行，依次条件过滤
export default [
  whenMapStateToPropsIsFunction,
  whenMapStateToPropsIsMissing
]
