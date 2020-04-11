import { BelT, Pair } from "./type";
import { atom, car, cdr, pair } from "./pair";
import { sym, symbol, t } from "./sym";
import { Continuation } from "./continuation";
import { Environment } from "./environment";

function number(x: BelT) {
  return typeof x === "number";
}

function string(x: BelT) {
  return typeof x === "string";
}

function taggedList(x: Pair, tag: symbol) {
  return pair(x) && car(x) === tag;
}

const apply = sym("apply");
const o = sym("o");
const lit = sym("lit");

function selfEvaluating(x: BelT) {
  return (
    x === null ||
    number(x) ||
    string(x) ||
    taggedList(x as Pair, lit) ||
    (symbol(x) && (x === t || x === o || x === apply))
  );
}

function evaluateQuote(v: BelT, r: Environment, k: Continuation) {
  k.resume(v);
}

function evaluateVariable(n: symbol, r: Environment, k: Continuation) {
  r.lookup(n, k);
}

export function evaluate(e: BelT, r: Environment, k: Continuation): void {
  if (atom(e)) {
    if (selfEvaluating(e)) {
      evaluateQuote(e, r, k);
      return;
    }

    evaluateVariable(e as symbol, r, k);
    return;
  }
}
