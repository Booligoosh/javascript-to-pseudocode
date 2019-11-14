// Settings
const INDENT_SIZE = 4
const CAPITALIZATION = null // `LOWERCASE`, `UPPERCASE`, `CAPITALIZE`, or null

// End settings
const fs = require(`fs`)
const esprima = require('esprima')
const program = fs.readFileSync('program.js').toString()

const pseudocode = javaScriptToPseudoCode(program)
console.log(`------------------------`)
console.log(`Here is your pseudocode!`)
console.log(`------------------------`)
console.log(pseudocode)

function javaScriptToPseudoCode (javaScript) {
    const parsed = esprima.parseScript(program)
    return `BEGIN\n${parsed.body.map(item => indentLines(objToString(item), 1)).join(`\n`)}\nEND`
}

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
            // I made this type up — see the IfStatement case code
            temp = `${obj.type === `ElseIfStatement` ? `\nELSE ` : ``}IF ${objToString(obj.test)} THEN\n`
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
                return `get ${objToString(obj.left)}`
            }
            return `${objToString(obj.left)} ${obj.operator} ${objToString(obj.right)}`
        case `VariableDeclaration`:
            return obj.declarations.map(declaration => {
                if (declaration.init.type === `CallExpression` && declaration.init.callee.name === `prompt`) {
                    return `get ${objToString(declaration.id)}`
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
                return `Display ${obj.arguments.map(arg => objToString(arg)).join(`; `)}`
            }
            return `${objToString(obj.callee)}(${obj.arguments.map(arg => objToString(arg)).join(`, `)})`
        case `MemberExpression`:
            return `${objToString(obj.object)}.${objToString(obj.property)}`
        case `TemplateLiteral`:
            temp = []
            for (let i = 0; i < Math.max(obj.quasis.length, obj.expressions.length); i++) {
                if (i < obj.quasis.length) temp.push(objToString(obj.quasis[i]))
                if (i < obj.expressions.length) temp.push(objToString(obj.expressions[i]))
            }
            return temp.join(` + `)
        case `TemplateElement`:
            return `'${obj.value.raw}'`
        default:
            console.log(`Unknown obj type`, obj.type, JSON.stringify(obj, null, 2))
            return `\x1b[31m${obj.type} not implemented\x1b[0m`
    }
}

function indentLines (str, n) {
    return str.split(`\n`).map(line => ` `.repeat(n * INDENT_SIZE) + line).join(`\n`)
}