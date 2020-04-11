import { BelT } from "./type";

export function nom(sym: symbol): string {
  const s = sym.toString();
  return s.substring(7, s.length - 1);
}

export function sym(s: string): symbol {
  return Symbol.for(s);
}

export function symbol(x: BelT): boolean {
  return typeof x === "symbol";
}

export const nil: symbol = sym("nil");
