import { BelT } from "./type";
import { nom, sym } from "./sym";
import { car, cdr, join, xar, xdr } from "./pair";
import { parse } from "./parse";
import { print } from "./print";
import { BaseCont } from "./continuation";
import { VariableEnv, initialEnvironment } from "./environment";
import { evaluate } from "./bel";
import { ccc, jsPrimitive } from "./value";

const baseCont = new BaseCont(null, gotResult);

function pr(got: string, x: BelT): void {
  let output: string[] = [];

  print(x, output);

  if (output.length > 0) {
    console.log(`got ${got}:`, output.join(""));
  }
}

let env = initialEnvironment;

function prim(name: string, f: any, arity: number) {
  let s = sym(name);
  env = new VariableEnv(env, s, jsPrimitive(s, f, arity));
}

const t: symbol = sym("t");
prim("+", (a: number, b: number) => a + b, 2);
prim("-", (a: number, b: number) => a - b, 2);
prim("*", (a: number, b: number) => a * b, 2);
prim("/", (a: number, b: number) => a / b, 2);
prim("id", (a: BelT, b: BelT) => a === b, 2);
prim("join", join, 2);
prim("car", car, 1);
prim("cdr", cdr, 1);
prim("xar", xar, 2);
prim("xdr", xdr, 2);
prim("sym", sym, 1);
prim("nom", nom, 1);
prim("coin", () => (Math.random() * 2 > 1 ? t : null), 0);
prim("display", (s: string) => console.log(s), 1);
env = new VariableEnv(env, sym("ccc"), ccc);

function gotExp(exp: BelT): void {
  pr("expression", exp);
  evaluate(exp, env, baseCont);
}

function gotResult(result: BelT): void {
  pr("result", result);
}

/*
parse(
  '(do (set x 30) 1 2 (display "done") (iff (coin) ((fn (x) x) (+ x 12)) (ccc (fn (return) (iff (coin) (return (- 100 1)) 3)))))',
  gotExp
);
*/

parse("((fn (a (b c) d e) (+ a (+ b (+ c (+ d e))))) 1 '(2 3) 4 5)", gotExp);
