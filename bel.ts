import { BelT, Pair } from "./type";
import { atom, car, cdr, pair } from "./pair";
import { sym, symbol, t } from "./sym";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluateIf } from "./iff";
import { evaluateBegin } from "./begin";

function cadr(e: Pair): BelT {
  return car(cdr(e) as Pair);
}

function caddr(e: Pair): BelT {
  return car(cdr(cdr(e) as Pair) as Pair);
}

function cadddr(e: Pair): BelT {
  return car(cdr(cdr(cdr(e) as Pair) as Pair) as Pair);
}

function cddr(e: Pair): BelT {
  return cdr(cdr(e) as Pair);
}

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
const quote = sym("quote");
const iff = sym("iff");
const begin = sym("do");

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

  let p: Pair = e as Pair;

  switch (car(p)) {
    case quote:
      evaluateQuote(cadr(p), r, k);
      break;

    case iff:
      evaluateIf(cadr(p), caddr(p), cadddr(p), r, k);
      break;

    case begin:
      evaluateBegin(cdr(p), r, k);
      break;

    /*
    case set:
      evaluateSet(cadr(e), caddr(e), r, k);
      break;

    case lambda:
      evaluateLambda(cadr(e), cddr(e), r, k);
      break;

    default:
      evaluateApplication(car(e), cdr(e), r, k);
			*/
  }
}
