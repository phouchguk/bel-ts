import { BelT, Pair } from "./type";
import { car, cdr, join, pair } from "./pair";
import { Continuation } from "./continuation";
import { Environment } from "./environment";
import { Value } from "./value";
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

class EvFnCont extends Continuation {
  args: BelT;
  r: Environment;

  constructor(k: Continuation, args: BelT, r: Environment) {
    super(k);

    this.args = args;
    this.r = r;
  }

  resume(f: BelT): void {
    evaluateArguments(
      this.args,
      this.r,
      new ApplyCont(this.k as Continuation, f as Value, this.r)
    );
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