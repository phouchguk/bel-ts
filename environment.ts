import { BelT, Pair } from "./type";
import { nom, sym, symbol } from "./sym";
import { car, cdr, pair } from "./pair";
import { Continuation } from "./continuation";

export abstract class Environment {
  abstract lookup(n: symbol, k: Continuation): void;
  abstract update(n: symbol, k: Continuation, v: BelT): void;
}

export class NullEnv extends Environment {
  lookup(n: symbol, _: Continuation): void {
    throw new Error("Unknown variable: " + nom(n));
  }

  update(n: symbol, _k: Continuation, _v: BelT): void {
    throw new Error("unknown variable: " + nom(n));
  }
}

const theEmptyEnvironment = new NullEnv();

export abstract class FullEnv extends Environment {
  other: Environment;
  name: symbol;

  constructor(other: Environment, name: symbol) {
    super();

    this.other = other;
    this.name = name;
  }
}

function lookup(e: VariableEnv, n: symbol, k: Continuation) {
  while (true) {
    if (e.name === n) {
      k.resume(e.value);
      return;
    }

    if (e.other === theEmptyEnvironment) {
      throw new Error("Unknown variable: " + nom(n));
    }

    e = e.other as VariableEnv;
  }
}

function update(e: VariableEnv, n: symbol, k: Continuation, v: BelT) {
  while (true) {
    if (e.name === n) {
      e.value = v;
      k.resume(v);

      return;
    }

    if (e.other === theEmptyEnvironment) {
      e.other = new VariableEnv(theEmptyEnvironment, n, v);
      k.resume(v);
      return;
    }

    e = e.other as VariableEnv;
  }
}

export class VariableEnv extends FullEnv {
  value: BelT;

  constructor(other: Environment, name: symbol, value: BelT) {
    super(other, name);

    this.value = value;
  }

  lookup(n: symbol, k: Continuation): void {
    lookup(this, n, k);
  }

  update(n: symbol, k: Continuation, v: BelT): void {
    update(this, n, k, v);
  }
}

export const initialEnvironment = new VariableEnv(
  theEmptyEnvironment,
  sym("version"),
  0.1
);

export function extendEnv(
  env: VariableEnv,
  names: BelT,
  values: BelT
): VariableEnv {
  if (pair(names) && pair(values)) {
    let n: BelT = car(names as Pair);
    let v: BelT = car(values as Pair);

    let rest: VariableEnv = extendEnv(
      env,
      cdr(names as Pair),
      cdr(values as Pair)
    );

    if (symbol(n)) {
      return new VariableEnv(rest, n as symbol, v);
    }

    if (pair(n)) {
      return extendEnv(rest, n, v);
    }

    throw new Error("invalid parameter");
  }

  if (names === null && values === null) {
    return env;
  }

  if (symbol(names)) {
    return new VariableEnv(env, names as symbol, values);
  }

  throw new Error("Arity mismatch -- EXTENDENV");
}
