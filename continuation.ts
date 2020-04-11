import { BelT, ExpressionHandler, Pair } from "./type";
import { car, length } from "./pair";
import { Environment } from "./environment";

export abstract class Continuation {
  k: Continuation | null;

  abstract resume(v: BelT): void;

  constructor(k: Continuation | null) {
    this.k = k;
  }

  invoke(vx: Pair, r: Environment, k: Continuation): void {
    if (length(vx) === 1) {
      this.resume(car(vx));
      return;
    }

    throw new Error("continuations expect 1 argument");
  }
}

export class BaseCont extends Continuation {
  f: ExpressionHandler;

  constructor(k: Continuation | null, f: ExpressionHandler) {
    super(k);

    this.f = f;
  }

  resume(v: BelT): void {
    this.f(v);
  }
}
