import { BelT, Pair, StringHandler } from "./type";
import { nom, symbol } from "./sym";
import { atom, car, cdr, pair } from "./pair";
import { Primitive, fn, macro, prim } from "./value";

function wrap(cls: string, val: string): string {
  return `<span class="${cls}">${val}</span>`;
}

export function prw(exp: BelT, output: string[]) {
  if (pair(exp)) {
    output.push(wrap("par", "("));

    let xs: BelT = exp;
    let first: boolean = true;

    while (xs !== null) {
      if (!first) {
        output.push(" ");
      }

      if (atom(xs)) {
        output.push(". ");
        prw(xs, output);
        break;
      }

      prw(car(xs as Pair), output);
      xs = cdr(xs as Pair);

      first = false;
    }

    output.push(wrap("par", ")"));
    return;
  }

  if (symbol(exp)) {
    output.push(wrap("sym", nom(exp as symbol)));
  } else if (fn(exp)) {
    output.push(wrap("unp", "&lt;fn&gt;"));
  } else if (macro(exp)) {
    output.push(wrap("unp", "&lt;macro&gt;"));
  } else if (prim(exp)) {
    output.push(wrap("unp", `&lt;prim:${nom((exp as Primitive).name)}&gt;`));
  } else if (exp === null) {
    output.push(wrap("sym", "nil"));
  } else if (typeof exp === "string") {
    output.push(
      wrap(
        "str",
        '"' +
          exp
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t")
            .replace(/\r/g, "\\r") +
          '"'
      )
    );
  } else {
    output.push(wrap("num", (exp as number) + ""));
  }
}

export function print(exp: BelT, output: string[]) {
  if (pair(exp)) {
    output.push("(");

    let xs: BelT = exp;
    let first: boolean = true;

    while (xs !== null) {
      if (!first) {
        output.push(" ");
      }

      if (atom(xs)) {
        output.push(". ");
        print(xs, output);
        break;
      }

      print(car(xs as Pair), output);
      xs = cdr(xs as Pair);

      first = false;
    }

    output.push(")");
    return;
  }

  if (symbol(exp)) {
    output.push(nom(exp as symbol));
  } else if (fn(exp)) {
    output.push("<fn>");
  } else if (macro(exp)) {
    output.push("<macro>");
  } else if (prim(exp)) {
    output.push(`<prim:${nom((exp as Primitive).name)}>`);
  } else if (exp === null) {
    output.push("nil");
  } else if (typeof exp === "string") {
    output.push(
      '"' +
        exp
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t")
          .replace(/\r/g, "\\r") +
        '"'
    );
  } else {
    output.push((exp as number) + "");
  }
}

export function pr(got: string, x: BelT): void {
  prs(x, function(s) {
    console.log(`${got}:`, s);
  });
}

export function prs(x: BelT, f: StringHandler): void {
  let output: string[] = [];

  print(x, output);

  if (output.length > 0) {
    f(output.join(""));
  }
}
