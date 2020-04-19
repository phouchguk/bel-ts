import { BelT, Pair } from "./type";
import { car, cdr, pair } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluate } from "./bel";
import { Next } from "./next";

class BeginCont extends Continuation {
  ex: Pair;
  r: Environment;

  constructor(k: Continuation, ex: Pair, r: Environment) {
    super(k);

    this.ex = ex;
    this.r = r;
  }

  resume(_: BelT):  Next | null {
    return evaluateBegin(cdr(this.ex), this.r, this.k as Continuation);
  }
}

export function evaluateBegin(ex: BelT, r: Environment, k: Continuation): Next {
  if (pair(ex)) {
    let p: Pair = ex as Pair;

    if (pair(cdr(p))) {
      return evaluate(car(p), r, new BeginCont(k, p, r));
    } else {
      return evaluate(car(p), r, k);
    }
  }

  return new Next(k, null);
}
