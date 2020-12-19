function StoreItem (key, value) {
  if (typeof key !== 'string') {
    console.log(`The argument that you passed to storeItem() - ${key} is not a string.`)
  }

  if (typeof value === 'undefined') {
    console.log('You cannot store undefined variables using storeItem().')
  }

  const type = typeof value
  switch (type) {
    case 'number':
    case 'boolean':
      value = value.toString()
      break
    case 'object':
      value = JSON.stringify(value)
      break
    case 'string':
    default:
      break
  }

  localStorage.setItem(key, value)
  const typeKey = `${key}typeID`
  localStorage.setItem(typeKey, type)
}

function GetItem (key) {
  let value = localStorage.getItem(key)
  const type = localStorage.getItem(`${key}typeID`)

  // print(typeof value)
  if (value !== null) {
    switch (type) {
      case 'number':
        value = parseInt(value)
        break
      case 'boolean':
        value = value === 'true'
        break
      case 'object':
        value = JSON.parse(value)
        break
      case 'string':
      default:
        break
    }
  }

  return value
}
