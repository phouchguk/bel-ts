import { BelT, Cell, Pair } from "./type";

export function join(a: BelT, d: BelT): Cell {
  return new Cell(a, d);
}

export function car(p: Pair): BelT {
  if (p === null) {
    return null;
  }

  return p.a;
}

export function cdr(p: Pair): BelT {
  if (p === null) {
    return null;
  }

  return p.d;
}

export function xar(p: Cell, a: BelT): BelT {
  p.a = a;
  return a;
}

export function xdr(p: Cell, d: BelT): BelT {
  p.d = d;
  return d;
}

export function pair(x: BelT): boolean {
  return x instanceof Cell;
}

export function atom(x: BelT): boolean {
  return !pair(x);
}

export function length(xs: Pair) {
  let len: number = 0;

  while (xs !== null) {
    len++;
    xs = cdr(xs) as Pair;
  }

  return len;
}
