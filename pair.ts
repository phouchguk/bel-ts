import { BelT, Pair } from "./type";
import { nil } from "./sym";

export function join(a: BelT, d: BelT): Pair {
  return new Pair(a, d);
}

export function car(p: Pair): BelT {
  return p.a;
}

export function cdr(p: Pair): BelT {
  return p.d;
}

export function xar(p: Pair, a: BelT): BelT {
  p.a = a;
  return a;
}

export function xdr(p: Pair, d: BelT): BelT {
  p.d = d;
  return d;
}

export function pair(x: BelT): boolean {
  return x instanceof Pair;
}

export function atom(x: BelT): boolean {
  return !pair(x);
}

export function length(xs: BelT) {
  let len: number = 0;

  while (xs !== nil) {
    len++;
    xs = cdr(xs as Pair);
  }

  return len;
}
