import { BelT, ExpressionHandler } from "./type";
import { Next } from "./next";

export abstract class Continuation {
  k: Continuation | null;

  constructor(k: Continuation | null) {
    this.k = k;
  }

  abstract resume(v: BelT): Next | null;
}

export class BaseCont extends Continuation {
  f: ExpressionHandler;

  constructor(k: Continuation | null, f: ExpressionHandler) {
    super(k);

    this.f = f;
  }

  resume(v: BelT): Next | null  {
    this.f(v);
    return null;
  }
}
