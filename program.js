var two = 0
var three = 0
var both = 0
var neither = 0
var number = prompt()
while (number) {
    if (number % 2 && number % 3) {
        both++
        if (two == three) {
            console.log('Nested IF statements')
        }
    } else if (number % 2) {
        two++
    } else if (number % 3) {
        three++
    } else {
        neither++
    }
    number = prompt()
}
console.log(`Divisible by two only: ${two}!`)
console.log(`Divisible by three only: ${three}!`)
console.log(`Divisible by both: ${both}!`)
console.log(`Divisible by neither: ${neither}!`)
console.log(two, three, 123, `hello`, hello.world(5, 7 + 1))