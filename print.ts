import { BelT, Pair } from "./type";
import { nil, nom, symbol } from "./sym";
import { atom, car, cdr, pair } from "./pair";

export function print(exp: BelT, output: string[]) {
  if (pair(exp)) {
    output.push("(");

    let xs: BelT = exp;
    let first: boolean = true;

    while (xs !== nil) {
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
    /*
  } else if (fn(exp)) {
    output.push("<fn>");
  } else if (prim(exp)) {
    output.push(`<prim:${nom(exp.name)}>`);
	*/
  } else if (typeof exp === "string") {
    output.push(
      '"' +
        exp
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\\n")
          .replace(/\t/g, "\\\t")
          .replace(/\r/g, "\\\r") +
        '"'
    );
  } else {
    output.push((exp as number) + "");
  }
}
