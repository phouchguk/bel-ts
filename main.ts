import { Pair } from "./type";
import { nil, nom, sym, symbol } from "./sym";
import { car, cdr, join, pair } from "./pair";

const p: Pair = join(1, join(2, join(3, nil)));
const test: symbol = sym("hello");

console.log(p);
console.log(pair(p));
console.log(car(p));
console.log(cdr(p));
console.log(symbol(test));
console.log(nom(test));
console.log(nil);
