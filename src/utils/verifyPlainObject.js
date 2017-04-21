import isPlainObject from 'lodash/isPlainObject'
import warning from './warning'

// 验证 value 是否是普通对象，否则抛出错误。
export default function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    )
  }
}
