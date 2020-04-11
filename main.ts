import { BelT, Pair } from "./type";
import { nom, sym, symbol } from "./sym";
import { car, cdr, join, pair } from "./pair";
import { parse } from "./parse";
import { print } from "./print";
import { BaseCont, IfCont } from "./continuation";
import { theEmptyEnvironment } from "./environment";

const p: Pair = join(1, join(2, join(3, null)));
const test: symbol = sym("hello");

function gotExp(exp: BelT): void {
  let output: string[] = [];

  print(exp, output);

  if (output.length > 0) {
    console.log("got expression:", output.join(""));
  }
}

console.log(
  new IfCont(new BaseCont(null, gotExp), null, null, theEmptyEnvironment)
);

console.log(p);
console.log(pair(p));
console.log(car(p));
console.log(cdr(p));
console.log(symbol(test));
console.log(nom(test));
parse('(1 2 hello "groove town") `(3 2 nil (1 0) ,@a (9 ,z ,@(4 5)))', gotExp);
