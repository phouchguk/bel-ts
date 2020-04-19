import { BelT, Pair } from "./type";
import { sym } from "./sym";
import { car, cdr, join, pair } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { Macro, Value, macro } from "./value";
import { evaluate } from "./bel";
import { Next } from "./next";

function applyArgs(args: Pair): Pair {
  // arrange args
  let rev: Pair = null;

  while (true) {
    if (cdr(args) === null) {
      // last arg, must be a pair
      if (!pair(car(args))) {
        throw new Error("last arg to apply must be a pair");
      }

      args = car(args) as Pair;

      while (rev !== null) {
        args = join(car(rev), args);
        rev = cdr(rev) as Pair;
      }

      break;
    } else {
      // store the leading args to join onto final arg
      rev = join(car(args), rev);
      args = cdr(args) as Pair;
    }
  }

  return args;
}

class ApplyCont extends Continuation {
  f: Value | symbol;

  constructor(k: Continuation, f: Value | symbol) {
    super(k);

    this.f = f;
  }

  resume(args: BelT): Next | null {
    if (this.f === sym("apply")) {
       this.f = car(args as Pair) as Value;
       args = applyArgs(cdr(args as Pair) as Pair);
    }

    return (this.f as Value).invoke(args, this.k as Continuation);
  }
}

class ArgumentCont extends Continuation {
  remaining: BelT;
  r: Environment;

  constructor(k: Continuation, remaining: BelT, r: Environment) {
    super(k);

    this.remaining = remaining;
    this.r = r;
  }

  resume(arg: BelT): Next | null {
    return evaluateArguments(
      cdr(this.remaining as Pair),
      this.r,
      new GatherCont(this.k as Continuation, arg)
    );
  }
}

// evaluates a macro after expansion
class MacroCont extends Continuation {
  r: Environment;

  constructor(k: Continuation, r: Environment) {
    super(k);

    this.r = r;
  }

  resume(expanded: BelT): Next | null {
    //pr("macro", expanded);
    return evaluate(expanded, this.r, this.k as Continuation);
  }
}

class EvFnCont extends Continuation {
  r: Environment;
  args: BelT;

  constructor(k: Continuation, args: BelT, r: Environment) {
    super(k);

    this.args = args;
    this.r = r;
  }

  resume(op: BelT): Next | null {
    if (macro(op)) {
      let m: Macro = op as Macro;

      // evaluate macro with unevaluated args, pass to MacroCont which evaluates the expansion
      return m.invoke(
        this.args,
        new MacroCont(this.k as Continuation, this.r)
      );
    } else {
      return evaluateArguments(
        this.args,
        this.r,
        new ApplyCont(this.k as Continuation, op as Value)
      );
    }
  }
}

class GatherCont extends Continuation {
  arg: BelT;

  constructor(k: Continuation, arg: BelT) {
    super(k);

    this.arg = arg;
  }

  resume(args: BelT): Next | null {
    return (this.k as Continuation).resume(join(this.arg, args));
  }
}

const noMoreArguments: null = null;

function evaluateArguments(args: BelT, r: Environment, k: Continuation): Next {
  if (pair(args)) {
    return evaluate(car(args as Pair), r, new ArgumentCont(k, args, r));
  }

  return new Next(k, noMoreArguments);
}

export function evaluateApplication(
  op: BelT,
  args: BelT,
  r: Environment,
  k: Continuation
): Next {
  return evaluate(op, r, new EvFnCont(k, args, r));
}
