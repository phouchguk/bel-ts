import { BelT, Pair, number, string } from "./type";
import { atom, car, cdr, cadr, caddr, cadddr, cddr, pair } from "./pair";
import { sym, symbol, t } from "./sym";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { Fn, Macro } from "./value";
import { evaluateIf } from "./iff";
import { evaluateBegin } from "./begin";
import { evaluateSet } from "./set";
import { evaluateApplication } from "./application";

function taggedList(x: Pair, tag: symbol): boolean {
  return pair(x) && car(x) === tag;
}

const apply: symbol = sym("apply");
const o: symbol = sym("o");
const lit: symbol = sym("lit");
const quote: symbol = sym("quote");
const iff: symbol = sym("iff");
const begin: symbol = sym("do");
const set: symbol = sym("set");
const lambda: symbol = sym("fn");
const macro: symbol = sym("macro");

function selfEvaluating(x: BelT): boolean {
  return (
    x === null ||
    number(x) ||
    string(x) ||
    taggedList(x as Pair, lit) ||
    (symbol(x) && (x === t || x === o || x === apply))
  );
}

function evaluateQuote(v: BelT, _: Environment, k: Continuation): void {
  k.resume(v);
}

function evaluateVariable(n: symbol, r: Environment, k: Continuation): void {
  r.lookup(n, k);
}

function evaluateLambda(
  nx: BelT,
  ex: BelT,
  r: Environment,
  k: Continuation
): void {
  k.resume(new Fn(nx, ex, r));
}

function evaluateMacro(
  nx: BelT,
  ex: BelT,
  r: Environment,
  k: Continuation
): void {
  k.resume(new Macro(nx, ex, r));
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

    case set:
      evaluateSet(cadr(p) as symbol, caddr(p), r, k);
      break;

    case lambda:
      evaluateLambda(cadr(p), cddr(p), r, k);
      break;

    case macro:
      evaluateMacro(cadr(p), cddr(p), r, k);
      break;

    default:
      evaluateApplication(car(p), cdr(p), r, k);
  }
}
