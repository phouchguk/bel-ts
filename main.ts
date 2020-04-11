import { BelT } from "./type";
import { parse } from "./parse";
import { print } from "./print";
import { BaseCont } from "./continuation";
import { theEmptyEnvironment } from "./environment";
import { evaluate } from "./bel";

const baseCont = new BaseCont(null, gotResult);

function pr(got: string, x: BelT): void {
  let output: string[] = [];

  print(x, output);

  if (output.length > 0) {
    console.log(`got ${got}:`, output.join(""));
  }
}

function gotExp(exp: BelT): void {
  pr("expression", exp);
  evaluate(exp, theEmptyEnvironment, baseCont);
}

function gotResult(result: BelT): void {
  pr("result", result);
}

parse("(do 1 2 (iff nil 42 '(1 2 3)))", gotExp);
//parse('(1 2 hello "groove town") `(3 2 nil (1 0) ,@a (9 ,z ,@(4 5)))', gotExp);
