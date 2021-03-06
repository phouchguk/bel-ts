import { BelT, Pair, number, string } from "./type";
import { atom, car, cdr, cadr, caddr, cdddr, cddr, join, pair } from "./pair";
import { sym, symbol, t } from "./sym";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { Fn, Macro } from "./value";
import { evaluateIf } from "./iff";
import { evaluateBegin } from "./begin";
import { evaluateSet } from "./set";
import { evaluateApplication } from "./application";
import { Next } from "./next";
//import { pr } from "./print";

function taggedList(x: Pair, tag: symbol): boolean {
  return pair(x) && car(x) === tag;
}

const apply: symbol = sym("apply");
const o: symbol = sym("o");
const lit: symbol = sym("lit");
const quote: symbol = sym("quote");
const iff: symbol = sym("if");
const begin: symbol = sym("do");
const set: symbol = sym("set");
const lambda: symbol = sym("fn");
const macro: symbol = sym("macro");
const bq: symbol = sym("bquote");

function selfEvaluating(x: BelT): boolean {
  return (
    x === null ||
    number(x) ||
    string(x) ||
    taggedList(x as Pair, lit) ||
    (symbol(x) && (x === t || x === o || x === apply))
  );
}

function evaluateQuote(v: BelT, _: Environment, k: Continuation): Next {
  return new Next(k, v);
}

function evaluateVariable(n: symbol, r: Environment, k: Continuation): Next {
  return r.lookup(n, k);
}

function evaluateLambda(
  nx: BelT,
  ex: BelT,
  r: Environment,
  k: Continuation
): Next {
  return new Next(k, new Fn(nx, ex, r));
}

function evaluateMacro(
  nx: BelT,
  ex: BelT,
  r: Environment,
  k: Continuation
): Next {
  return new Next(k, new Macro(nx, ex, r));
}

export function evaluate(e: BelT, r: Environment, k: Continuation): Next {
  if (atom(e)) {
    if (selfEvaluating(e)) {
      return evaluateQuote(e, r, k);
    }

    return evaluateVariable(e as symbol, r, k);
  }

  while (true) {
    let p: Pair = e as Pair;

    switch (car(p)) {
      case quote:
        return evaluateQuote(cadr(p), r, k);

      case bq:
        // should be in expand?
        e = bquote(cadr(p));
        continue;

      case iff:
        return evaluateIf(cadr(p), caddr(p), cdddr(p), r, k);

      case begin:
        return evaluateBegin(cdr(p), r, k);

      case set:
        return evaluateSet(cadr(p) as symbol, caddr(p), r, k);

      case lambda:
        return evaluateLambda(cadr(p), cddr(p), r, k);

      case macro:
        return evaluateMacro(cadr(p), cddr(p), r, k);

      default:
        return evaluateApplication(car(p), cdr(p), r, k);
    }
  }
}

function bquote(x: BelT): BelT {
  if (!pair(x)) {
    return join(quote, join(x, null));
  }

  const p: Pair = x as Pair;
  const tag: BelT = car(p);

  if (tag === sym("comma-at")) {
    throw new Error("can't splice here");
  }

  if (tag === sym("comma")) {
    return cadr(p);
  }

  if (pair(tag) && car(tag as Pair) === sym("comma-at")) {
    return join(sym("append"), join(cadr(tag as Pair), join(bquote(cddr(tag as Pair)), null)));
  }

  return join(sym("join"), join(bquote(tag), join(bquote(cdr(p)), null)));
}

/*
def expand_quasiquote(x):
    """Expand `x => 'x; `,x => x; `(,@x y) => (append x y) """
    if not is_pair(x):
        return [_quote, x]
    require(x, x[0] is not _unquotesplicing, "can't splice here")
    if x[0] is _unquote:
        require(x, len(x)==2)
        return x[1]
    elif is_pair(x[0]) and x[0][0] is _unquotesplicing:
        require(x[0], len(x[0])==2)
        return [_append, x[0][1], expand_quasiquote(x[1:])]
    else:
        return [_cons, expand_quasiquote(x[0]), expand_quasiquote(x[1:])]
*/
