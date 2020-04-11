import { BelT } from "./type";
import { car, cdr, pair } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluate } from "./bel";

export class BeginCont extends Continuation {
  ex: BelT;
  r: Environment;

  constructor(k: Continuation, ex: BelT, r: Environment) {
    super(k);

    this.ex = ex;
    this.r = r;
  }

  resume(v: BelT): void {
    evaluateBegin(cdr(this.ex), this.r, this.k as Continuation);
  }
}

export function evaluateBegin(ex: BelT, r: Environment, k: Continuation) {
  if (pair(ex)) {
    if (pair(cdr(ex))) {
      evaluate(car(ex), r, new BeginCont(k, ex, r));
    } else {
      evaluate(car(ex), r, k);
    }

    return;
  }

  k.resume(nil);
}
