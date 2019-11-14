// Settings
const INDENT_SIZE = 4
const CAPITALIZATION = `CAPITALIZE` // `LOWERCASE`, `UPPERCASE`, `CAPITALIZE`, or null
// End settings
const fs = require(`fs`)
const esprima = require('esprima')
const program = fs.readFileSync('program.js').toString()

// console.log(program)

const parsed = esprima.parseScript(program)

// console.log(JSON.stringify(parsed, null, 2))
const pseudocode = `BEGIN
${parsed.body.map(item => indentLines(objToString(item), 1)).join(`\n`)}
END`
console.log(`------------------------`)
console.log(`Here is your pseudocode!`)
console.log(`------------------------`)
console.log(pseudocode)

function objToString (obj) {
    const type = obj.type
    let operator, temp
    switch (type) {
        case `Literal`:
            if (obj.value === false) return `FALSE`
            if (obj.value === true) return `TRUE`
            return obj.raw
        case `Identifier`:
            switch (CAPITALIZATION) {
                case `LOWERCASE`: return obj.name.toLowerCase()
                case `UPPERCASE`: return obj.name.toUpperCase()
                case `CAPITALIZE`: return obj.name[0].toUpperCase() + obj.name.slice(1).toLowerCase()
                default: return obj.name
            }
        case `LogicalExpression`:
            operator = obj.operator
            switch (operator) {
                case `&&`: operator = `AND`; break
                case `||`: operator = `OR`; break
            }
            return `${objToString(obj.left)} ${operator} ${objToString(obj.right)}`
        case `BinaryExpression`:
            operator = obj.operator
            switch (operator) {
                case `==`: case `===`: operator = `=`; break
                case `!=`: case `!==`: operator = `<>`; break
            }
            return `${objToString(obj.left)} ${operator} ${objToString(obj.right)}`
        case `WhileStatement`:
            return `WHILE ${objToString(obj.test)}\n${objToString(obj.body)}\nENDWHILE`
        case `IfStatement`:
        case `ElseIfStatement`:
            temp = `${obj.type === `ElseIfStatement` ? `\nELSE ` : ``}IF ${objToString(obj.test)}\n`
            temp += `${objToString(obj.consequent)}`
            if (obj.alternate) {
                if (obj.alternate.type == `IfStatement`) {
                    obj.alternate.type = `ElseIfStatement`
                } else {
                    temp += `\nELSE\n`
                }
                temp += `${objToString(obj.alternate)}`
            }
            if (obj.type === `IfStatement`) {
                temp += `\nENDIF`
            }
            return temp
        case `BlockStatement`:
            return obj.body.map(item => indentLines(objToString(item), 1)).join(`\n`)
        case `ExpressionStatement`:
            return objToString(obj.expression)
        case `UpdateExpression`:
            operator = obj.operator
            if (operator === `++`) return `INCREMENT ${objToString(obj.argument)}`
            if (operator === `--`) return `DECREMENT ${objToString(obj.argument)}`

            console.log(`Unknown update operator`, operator)
            return `?`
        case `AssignmentExpression`:
            if (obj.left.type === `Identifier`
            && obj.right.type === `CallExpression`
            && obj.right.callee.name === `prompt`) {
                return `INPUT ${objToString(obj.left)}`
            }
            return `${objToString(obj.left)} ${obj.operator} ${objToString(obj.right)}`
        case `VariableDeclaration`:
            return obj.declarations.map(declaration => {
                if (declaration.init.type === `CallExpression` && declaration.init.callee.name === `prompt`) {
                    return `INPUT ${objToString(declaration.id)}`
                }
                return `${objToString(declaration.id)} = ${objToString(declaration.init)}`
            }).join(`\n`)
        case `CallExpression`:
            const calleeAsString = objToString(obj.callee).toLowerCase()
            if (calleeAsString === `alert`
            || calleeAsString === `console.log`
            || calleeAsString === `console.info`
            || calleeAsString === `console.error`
            || calleeAsString === `console.warning`) {
                return `PRINT ${obj.arguments.map(arg => objToString(arg)).join(` + `)}`
            }
            return `${objToString(obj.callee)}(${obj.arguments.map(arg => objToString(arg)).join(`, `)})`
        case `MemberExpression`:
            return `${objToString(obj.object)}.${objToString(obj.property)}`
        default:
            console.log(`Unknown obj type`, obj.type, JSON.stringify(obj, null, 2))
            return `\x1b[31m${obj.type} not implemented\x1b[0m`
        break
    }
}

function indentLines (str, n) {
    return str.split(`\n`).map(line => ` `.repeat(n * INDENT_SIZE) + line).join(`\n`)
}