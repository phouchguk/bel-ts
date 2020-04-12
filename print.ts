import { BelT, Pair } from "./type";
import { nom, symbol } from "./sym";
import { atom, car, cdr, pair } from "./pair";
import { fn } from "./value";

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
    /*
  } else if (prim(exp)) {
    output.push(`<prim:${nom(exp.name)}>`);
	*/
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
