import { BelT, Pair } from "./type";
import { nom, sym, symbol } from "./sym";
import { car, cdr, join, pair } from "./pair";
import { parse } from "./parse";
import { print } from "./print";
import { BaseCont, IfCont } from "./continuation";
import { theEmptyEnvironment } from "./environment";
import { evaluate } from "./bel";

const p: Pair = join(1, join(2, join(3, null)));
const test: symbol = sym("hello");

const baseCont = new BaseCont(null, gotResult);

function gotExp(exp: BelT): void {
  evaluate(exp, theEmptyEnvironment, baseCont);
}

function gotResult(result: BelT): void {
  let output: string[] = [];

  print(result, output);

  if (output.length > 0) {
    console.log("got expression:", output.join(""));
  }
}

/*
console.log(new IfCont(baseCont, null, null, theEmptyEnvironment));
console.log(p);
console.log(pair(p));
console.log(car(p));
console.log(cdr(p));
console.log(symbol(test));
console.log(nom(test));
*/

parse("42", gotExp);
//parse('(1 2 hello "groove town") `(3 2 nil (1 0) ,@a (9 ,z ,@(4 5)))', gotExp);
