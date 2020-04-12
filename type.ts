import { Continuation } from "./continuation";
import { Value } from "./value";

export class Cell {
  a: BelT;
  d: BelT;

  constructor(a: BelT, d: BelT) {
    this.a = a;
    this.d = d;
  }
}

export type ExpressionHandler = (x: BelT) => void;
export type Atom = number | string | symbol | Value | Continuation | null;
export type Pair = Cell | null;
export type BelT = Atom | Cell;
