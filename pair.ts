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

export function cadr(e: Pair): BelT {
  return car(cdr(e) as Pair);
}

export function caddr(e: Pair): BelT {
  return car(cdr(cdr(e) as Pair) as Pair);
}

export function cadddr(e: Pair): BelT {
  return car(cdr(cdr(cdr(e) as Pair) as Pair) as Pair);
}

export function cdddr(e: Pair): BelT {
  return cdr(cdr(cdr(e) as Pair) as Pair);
}

export function cddr(e: Pair): BelT {
  return cdr(cdr(e) as Pair);
}

export function toArray(xs: Pair): BelT[] {
  let arr: BelT[] = [];
  let i: number = 0;

  while (xs !== null) {
    arr[i++] = car(xs);
    xs = cdr(xs) as Pair;
  }

  return arr;
}

export function length(xs: Pair): number {
  let len: number = 0;

  while (xs !== null) {
    len++;
    xs = cdr(xs) as Pair;
  }

  return len;
}
