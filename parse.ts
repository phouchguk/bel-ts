import { BelT, ExpressionHandler, Pair } from "./type";
import { sym, t } from "./sym";
import { car, cadr, cdr, cddr, join, xdr } from "./pair";

let send: null | ExpressionHandler = null;
const token: string[] = [];
const nrRe: RegExp = /^-?[0-9][0-9\.]*$/;

export function parse(s: string, callback: ExpressionHandler): void {
  send = callback;
  const chars: string[] = s.split("");

  for (let i: number = 0; i < chars.length; i++) {
    parseChar(chars[i]);
  }

  if (token.length > 0) {
    parseToken(token.join(""));
    token.length = 0;
  }
}

let comment: boolean = false;
let improper: boolean = false;
let expectClose: boolean = false;
let inStr: boolean = false;
let strEscape: boolean = false;
let comma: boolean = false;

function addqn(s: string): void {
  if (quoteNext === "") {
    quoteNext = s;
  } else {
    quoteNext += ":" + s;
  }
}

function parseChar(c: string): void {
  if (inStr) {
    if (strEscape) {
      strEscape = false;

      switch (c) {
        case '"':
          token.push(c);
          return;

        case "r":
          token.push("\r");
          return;

        case "n":
          token.push("\n");
          return;

        case "t":
          token.push("\t");
          return;

        default:
          throw new Error("unrecognised escape sequence \\" + c);
      }
    }

    if (c === "\\") {
      strEscape = true;
      return;
    }

    token.push(c);

    if (c === '"') {
      inStr = false;
      parseToken(token.join(""));
      token.length = 0;
    }
  } else {
    if (comment) {
       if (c === "\n") {
         comment = false;
       }

       return;
    }

    if (c.trim() === "") {
      if (token.length > 0) {
        parseToken(token.join(""));
        token.length = 0;
      }

      return;
    }

    if (comma) {
      comma = false;

      if (c === "@") {
        addqn(",@");
      } else {
        addqn(",");

        parseChar(c);
      }

      return;
    }

    if (c === '"') {
      inStr = true;
      token.push(c);
      return;
    }

    if (
      c === "(" ||
      c === ")" ||
      c === "[" ||
      c === "]" ||
      c === "'" ||
      c === "`" ||
      c === "`" ||
      c === "," ||
      c === ";"
    ) {
      if (token.length > 0) {
        parseToken(token.join(""));
        token.length = 0;
      }

      if (c === ";") {
        comment = true;
        return;
      }

      if (c === ",") {
        comma = true;
        return;
      }

      if (c === "(" || c === ")" || c === "[" || c === "]") {
        parseToken(c);
      } else {
        addqn(c);
      }
    } else {
      token.push(c);
    }
  }
}

let listStack: Pair = null;
let quoteStack: Pair = null;
let squareStack: Pair = null;

function pushLs(x: BelT): void {
  let list: BelT = car(listStack);
  list = join(x, list);

  listStack = join(list, cdr(listStack));
}

let quoteNext: string = "";

function quote(q: string): symbol {
  switch (q) {
    case "'":
      return sym("quote");
    case "`":
      return sym("bquote");
    case ",":
      return sym("comma");
    case ",@":
      return sym("comma-at");

    default:
      throw new Error("unrecognised quote: " + q);
  }
}

function parseToken(token: string): void {
  if (token === "(" || token === "[") {
    if (expectClose) {
      throw new Error("bad '('");
    }

    listStack = join(null, listStack);

    quoteStack = join(quoteNext, quoteStack);
    quoteNext = "";

    squareStack = join(token === "[" ? t : null, squareStack);

    return;
  }


  if (token === ".") {
    if (listStack === null || improper || expectClose) {
      throw new Error("bad '.'");
    } else {
      improper = true;
      return;
    }
  }

  if (token === ")" || token === "]") {
    if (listStack === null) {
      throw new Error("bad '" + token  + "'");
    } else if (improper && !expectClose) {
      throw new Error("bad '.'");
    } else {
      let q: string = car(quoteStack) as string;
      quoteStack = cdr(quoteStack) as Pair;

      let b: BelT = car(squareStack);
      squareStack = cdr(squareStack) as Pair;

      // reverse list
      let list: Pair = car(listStack) as Pair;
      listStack = cdr(listStack) as Pair;

      let xs: Pair = null;

      while (list !== null) {
        xs = join(car(list), xs);
        list = cdr(list) as Pair;
      }

      if (expectClose) {
        // make the list improper

        list = xs;

        while (list !== null) {
          if (cddr(list) === null) {
            xdr(list, cadr(list));

            improper = false;
            expectClose = false;

            break;
          }


          list = cdr(list) as Pair;
        }
      }

      if (q !== "") {
        xs = unqn(q, xs);
        //xs = join(quote(q), join(xs, null));
      }

      if (b !== null) {
        // square bracket fn
        const sbargs: Pair = join(sym("_"), null);
        xs = join(sym("fn"), join(sbargs, join(xs, null)));
      }

      if (listStack === null) {
        // finished top level list
        (send as ExpressionHandler)(xs);
      } else {
        // nested list
        pushLs(xs);
      }
    }

    return;
  }

  // might be quoted, so BelT not an Atom
  let atom: BelT = null;

  if (nrRe.test(token)) {
    const nr: number = parseFloat(token);

    if (isNaN(nr)) {
      throw new Error("unrecignised number: " + token);
    }

    atom = nr;
  } else {
    if (token.startsWith('"')) {
      atom = token
        .substring(1, token.length - 1)
        .replace(/\\"/g, '"')
        .replace(/\\\n/g, "\n")
        .replace(/\\\r/g, "\r")
        .replace(/\\\t/g, "\t");
    } else {
      if (token === "nil") {
        atom = null;
      } else {
        atom = sym(token);
      }
    }
  }

  if (quoteNext.length > 0) {
    atom = unqn(quoteNext, atom);
    quoteNext = "";
  }

  if (improper) {
    expectClose = true;
  }

  if (listStack === null) {
    (send as ExpressionHandler)(atom);
  } else {
    // parsing a list
    pushLs(atom);
  }
}


function unqn(qn: string, xs: BelT): Pair {
  let qnParts: string[] = qn.split(":");

  for(let i: number = qnParts.length - 1; i >= 0; i--) {
    xs = join(quote(qnParts[i]), join(xs, null));
  }

  return xs as Pair;
}