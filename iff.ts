import { BelT, Pair } from "./type";
import { car, cadr, cddr } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluate } from "./bel";

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

  resume(v: BelT): void {
    let k: Continuation = this.k as Continuation;

    if (v === null) {
       if (this.ef === null) {
         // no alternative
         k.resume(null);
         return;
       }

       const p: Pair = this.ef as Pair;
       const alt: BelT = car(p);

       if (cddr(p) === null) {
         // last alternative
         evaluate(alt, this.r, k);
         return;
       }

       // alt cond
       evaluateIf(alt, cadr(p), cddr(p), this.r, k);
    } else {
      evaluate(this.et, this.r, k);
    }
  }
}

export function evaluateIf(
  ec: BelT,
  et: BelT,
  ef: BelT,
  r: Environment,
  k: Continuation
) {
  evaluate(ec, r, new IfCont(k, et, ef, r));
}
