const { data } = require('./data')
console.log(data.length)
const users = data.filter((v, i, a) => a.findIndex(t => (t.email === v.email)) === i)

console.log(users.length)

console.log(JSON.stringify(users))
