import { Atom, BelT, ExpressionHandler, Pair } from "./type";
import { sym, t } from "./sym";
import { car, cdr, join } from "./pair";

let send: null | ExpressionHandler = null;
const token: string[] = [];

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

let inStr: boolean = false;
let strEscape: boolean = false;
let comma: boolean = false;

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
        quoteNext = ",@";
      } else {
        quoteNext = ",";

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
      c === "'" ||
      c === "`" ||
      c === "`" ||
      c === ","
    ) {
      if (token.length > 0) {
        parseToken(token.join(""));
        token.length = 0;
      }

      if (c === ",") {
        comma = true;
        return;
      }

      if (c === "(" || c === ")") {
        parseToken(c);
      } else {
        quoteNext = c;
      }
    } else {
      token.push(c);
    }
  }
}

let listStack: Pair = null;
let quoteStack: Pair = null;

function pushLs(x: BelT): void {
  let list: BelT = car(listStack);
  list = join(x, list);

  listStack = join(list, cdr(listStack));
}

function isQuote(c: string): boolean {
  return c === "'" || c === "`" || c === "," || c === ",@";
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
  if (token === "(") {
    listStack = join(null, listStack);

    quoteStack = join(quoteNext, quoteStack);
    quoteNext = "";

    return;
  }

  if (token === ")") {
    if (listStack === null) {
      throw new Error("bad ')'");
    } else {
      let q: string = car(quoteStack) as string;
      quoteStack = cdr(quoteStack) as Pair;

      // reverse list
      let list: Pair = car(listStack) as Pair;
      listStack = cdr(listStack) as Pair;

      let xs: Pair = null;

      while (list !== null) {
        xs = join(car(list), xs);
        list = cdr(list) as Pair;
      }

      if (q !== "") {
        xs = join(quote(q), join(xs, null));
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

  const nr: number = parseFloat(token);

  if (isNaN(nr)) {
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
  } else {
    atom = nr;
  }

  if (quoteNext.length > 0) {
    atom = join(quote(quoteNext), join(atom, null));
    quoteNext = "";
  }

  if (listStack === null) {
    (send as ExpressionHandler)(atom);
  } else {
    // parsing a list
    pushLs(atom);
  }
}
