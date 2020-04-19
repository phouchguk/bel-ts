import { BelT, Pair } from "./type";
import { car, cadr, cddr } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluate } from "./bel";
import { Next } from "./next";

class IfCont extends Continuation {
  et: BelT;
  ef: BelT;
  r: Environment;

  constructor(k: Continuation, et: BelT, ef: BelT, r: Environment) {
    super(k);

    this.et = et;
    this.ef = ef;
    this.r = r;
  }

  resume(v: BelT): Next | null {
    let k: Continuation = this.k as Continuation;

    if (v === null) {
       if (this.ef === null) {
         // no alternative
         return new Next(k, null);
       }

       const p: Pair = this.ef as Pair;
       const alt: BelT = car(p);

       if (cddr(p) === null) {
         // last alternative
         return evaluate(alt, this.r, k);
       }

       // alt cond
       return evaluateIf(alt, cadr(p), cddr(p), this.r, k);
    } else {
      return evaluate(this.et, this.r, k);
    }
  }
}

export function evaluateIf(
  ec: BelT,
  et: BelT,
  ef: BelT,
  r: Environment,
  k: Continuation
): Next {
  return evaluate(ec, r, new IfCont(k, et, ef, r));
}
