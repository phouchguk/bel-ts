import { BelT, Pair } from "./type";
import { car, cdr, join, pair } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { Macro, Value, macro } from "./value";
import { evaluate } from "./bel";

class ApplyCont extends Continuation {
  f: Value;
  r: Environment;

  constructor(k: Continuation, f: Value, r: Environment) {
    super(k);

    this.f = f;
    this.r = r;
  }

  resume(args: BelT): void {
    this.f.invoke(args, this.r, this.k as Continuation);
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

  resume(arg: BelT): void {
    evaluateArguments(
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

  resume(expanded: BelT): void {
    evaluate(expanded, this.r, this.k as Continuation);
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

  resume(op: BelT): void {
    if (macro(op)) {
      let m: Macro = op as Macro;
      // evaulate macro with unevaluated args, pass to MacroCont which evaluates the expansion
      m.invoke(
        this.args,
        this.r,
        new MacroCont(this.k as Continuation, this.r)
      );
    } else {
      evaluateArguments(
        this.args,
        this.r,
        new ApplyCont(this.k as Continuation, op as Value, this.r)
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

  resume(args: BelT): void {
    (this.k as Continuation).resume(join(this.arg, args));
  }
}

const noMoreArguments: null = null;

function evaluateArguments(args: BelT, r: Environment, k: Continuation) {
  if (pair(args)) {
    evaluate(car(args as Pair), r, new ArgumentCont(k, args, r));
    return;
  }

  k.resume(noMoreArguments);
}

export function evaluateApplication(
  op: BelT,
  args: BelT,
  r: Environment,
  k: Continuation
): void {
  evaluate(op, r, new EvFnCont(k, args, r));
}
