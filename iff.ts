import { BelT } from "./type";
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
    evaluate(v === null ? this.ef : this.et, this.r, this.k as Continuation);
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
