import { BelT, ExpressionHandler, Pair, StringHandler, number, string } from "./type";
import { nom, sym, symbol } from "./sym";
import { car, cdr, join, pair, xar, xdr } from "./pair";
import { parse } from "./parse";
import { prs } from "./print";
import { BaseCont } from "./continuation";
import { VariableEnv, initialEnvironment } from "./environment";
import { evaluate } from "./bel";
import { ccc, jsPrimitive } from "./value";
import { Next } from "./next";

const baseCont = new BaseCont(null, gotResult);

let env = initialEnvironment;

function prim(name: string, f: any, arity: number) {
  let s = sym(name);
  env = new VariableEnv(env, s, jsPrimitive(s, f, arity));
}

let gensym: number = 0;

const t: symbol = sym("t");
prim("+", (a: number, b: number) => a + b, 2);
prim("-", (a: number, b: number) => a - b, 2);
prim("*", (a: number, b: number) => a * b, 2);
prim("/", (a: number, b: number) => a / b, 2);
prim("id", (a: BelT, b: BelT) => (a === b ? t : null), 2);
prim("join", join, 2);
prim("car", car, 1);
prim("cdr", cdr, 1);
prim("xar", xar, 2);
prim("xdr", xdr, 2);
prim("sym", sym, 1);
prim("nom", nom, 1);
prim("coin", () => (Math.random() * 2 > 1 ? t : null), 0);
prim("uvar", () => sym("_g" + gensym++), 0);

prim(
  "display",
  (s: string) => {
    console.log(s);
    return s;
  },
  1
);

prim(
  "type",
  (x: BelT) => {
    if (x === null || symbol(x)) {
      return sym("symbol");
    }

    if (pair(x)) {
      return sym("pair");
    }

    if (number(x)) {
      return sym("number");
    }

    if (string(x)) {
      return sym("string");
    }

    return sym("???");
  },
  1
);

env = new VariableEnv(env, sym("ccc"), ccc);

function equal(e1: BelT, e2: BelT): boolean {
  if (pair(e1)) {
    if (!pair(e2)) {
      return false;
    }

    const p1: Pair = e1 as Pair;
    const p2: Pair = e2 as Pair;

    return equal(car(p1), car(p2)) && equal(cdr(p1), cdr(p2));
  } else {
    return e1 === e2;
  }
}

function expandSymbol(sm: symbol): BelT {
  let s: string = nom(sm);

  if (s.indexOf("|") > -1) {
    const parts: string[] = s.split("|");
    return join(t, join(sym(parts[0]), join(sym(parts[1]), null)));
  }

  if (s.indexOf(".") > -1 || s.indexOf("!") > -1) {
    let upon: boolean = false;
    let bang: boolean = s[0] === "!";

    if (s[0] === "." || bang) {
      upon = true;
      s = s.substring(1);
    }

    const splitters = s.split("").filter(s => s === "." || s === "!");
    const parts: string[] = s.split(/[!\.]/);
    let result: Pair = null;

    for (let i: number = parts.length - 1; i >= 0; i--) {
      let psm: BelT = sym(parts[i]);

      if (i > 0 && splitters[i - 1] === "!") {
        psm = join(sym("quote"), join(psm, null));
      }

      result = join(psm, result);
    }

    if (upon) {
      if (bang) {
        result = join(sym("quote"), result);
        return join(sym("upon"), join(result, null));
      } else {
        return join(sym("upon"), result);
      }
    } else {
      return result;
    }
  }

  // (t x ((quote (compose (compose no f) g)) a))
  // (t x ((compose (compose no f) g) (quote a)))
  // (t x ((compose (compose no f) g) (quote a)))

  if (s.indexOf(":") > -1) {
    const parts: string[] = s.split(":");
    let result: Pair = null;

    for (let i: number = parts.length - 1; i >= 0; i--) {
      let psm: BelT = sym(parts[i]);
      result = join(psm, result);
    }

    return join(sym("compose"), result);
  }

  if (s[0] === "~") {
    return join(
      sym("compose"),
      join(sym("no"), join(sym(s.substring(1)), null))
    );
  }

  return sm;
}

function expand(exp: BelT): BelT {
  let lastExp: BelT = null;

  while (true) {
    /*
    pr("e", exp);
    pr("last e", lastExp);
    */

    if (equal(exp, lastExp)) {
      // finished expanding
      return exp;
    }

    lastExp = exp;

    if (pair(exp)) {
      let p: Pair = exp as Pair;

      /*
      if (number(car(p))) {
        exp = join(sym("nth"), p);
        continue;
      }
      */

      while (p !== null) {
        xar(p, expand(car(p)));

        const d: BelT = cdr(p);

        if (d === null || pair(d)) {
          p = d as Pair;
          continue;
        }

        // improper?
        xdr(p, expand(d));
        break;
      }
    } else {
      if (symbol(exp)) {
        exp = expandSymbol(exp as symbol);
        continue;
      }
    }
  }
}

let errOut: StringHandler | null = null;
let expOut: StringHandler | null = null;
let resOut: ExpressionHandler | null = null;

function gotExp(exp: BelT): void {
  if (expOut !== null) {
    prs(exp, expOut as StringHandler);
  }

  gotExpansion(expand(exp));
}

function gotExpansion(exp: BelT): void {
  //pr("expansion", exp);
  try {
    let n: Next | null = evaluate(exp, env, baseCont);

    while (n !== null) {
      n = n.k.resume(n.v);
    }
  } catch (e) {
    if (errOut !== null) {
      errOut(e);
    }
  }
}

function gotResult(result: BelT): void {
  if (resOut !== null) {
    resOut(result);
  }
}

export function bel(
  s: string,
  err: StringHandler,
  exp: StringHandler,
  res: ExpressionHandler
) {
  errOut = err;
  expOut = exp;
  resOut = res;

  parse(s, gotExp);
}
