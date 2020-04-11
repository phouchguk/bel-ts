import { BelT, Pair } from "./type";
import { nil, nom, sym, symbol } from "./sym";
import { car, cdr, join, pair } from "./pair";
import { parse } from "./parse";

const p: Pair = join(1, join(2, join(3, nil)));
const test: symbol = sym("hello");

function gotExp(exp: BelT): void {
  console.log("got expression:", exp);
}

console.log(p);
console.log(pair(p));
console.log(car(p));
console.log(cdr(p));
console.log(symbol(test));
console.log(nom(test));
console.log(nil);
parse("(1 2 hello)", gotExp);
