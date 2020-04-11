import { BelT, Pair } from "./type";
import { nil, nom, sym, symbol } from "./sym";
import { car, cdr, join, pair } from "./pair";
import { parse } from "./parse";
import { print } from "./print";

const p: Pair = join(1, join(2, join(3, nil)));
const test: symbol = sym("hello");

function gotExp(exp: BelT): void {
  let output: string[] = [];

  print(exp, output);

  if (output.length > 0) {
    console.log("got expression:", output.join(""));
  }
}

console.log(p);
console.log(pair(p));
console.log(car(p));
console.log(cdr(p));
console.log(symbol(test));
console.log(nom(test));
console.log(nil);
parse('(1 2 hello "groove \\t\\"town\\"") (3 2 1 `(4 5))', gotExp);
