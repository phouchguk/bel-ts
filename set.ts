import { BelT } from "./type";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { evaluate } from "./bel";
import { Next } from "./next";

class SetCont extends Continuation {
  n: symbol;
  r: Environment;

  constructor(k: Continuation, n: symbol, r: Environment) {
    super(k);

    this.n = n;
    this.r = r;
  }

  resume(v: BelT): Next | null {
    return this.r.update(this.n, this.k as Continuation, v);
  }
}

export function evaluateSet(
  n: symbol,
  e: BelT,
  r: Environment,
  k: Continuation
): Next {
  return evaluate(e, r, new SetCont(k, n, r));
}
