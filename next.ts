import { BelT } from "./type";
import { Continuation } from "./continuation";

export class Next {
  k: Continuation;
  v: BelT;

  constructor(k: Continuation, v: BelT) {
    this.k = k;
    this.v = v;
  }
}