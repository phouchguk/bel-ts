import { Atom, BelT, Pair } from "./type";
import { nil, sym } from "./sym";
import { car, cdr, join } from "./pair";

type Cb = (x: BelT) => void;

let send: null | Cb = null;
const token: string[] = [];

export function parse(s: string, callback: Cb): void {
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

    if (c === '"') {
      inStr = true;
      token.push(c);
      return;
    }

    if (c === "(" || c === ")") {
      if (token.length > 0) {
        parseToken(token.join(""));
        token.length = 0;
      }

      parseToken(c);
    } else {
      token.push(c);
    }
  }
}

let listStack: BelT = nil;

function pushLs(x: BelT): void {
  let list: BelT = car(listStack as Pair);
  listStack = cdr(listStack as Pair);
  list = join(x, list);
  listStack = join(list, listStack);
}

function parseToken(token: string): void {
  if (token === "(") {
    listStack = join(nil, listStack);
    return;
  }

  if (token === ")") {
    if (listStack === nil) {
      throw new Error("bad ')'");
    } else {
      // reverse list
      let list: BelT = car(listStack as Pair);
      listStack = cdr(listStack as Pair);

      let xs: BelT = nil;

      while (list !== nil) {
        xs = join(car(list as Pair), xs);
        list = cdr(list as Pair);
      }

      if (listStack === nil) {
        // finished top level list
        (send as Cb)(xs);
      } else {
        // nested list
        pushLs(xs);
      }
    }

    return;
  }

  let atom: Atom = nil;

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
      atom = sym(token);
    }
  } else {
    atom = nr;
  }

  if (listStack === nil) {
    (send as Cb)(atom);
  } else {
    // parsing a list
    pushLs(atom);
  }
}
