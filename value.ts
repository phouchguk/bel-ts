import { BelT, Pair } from "./type";
import { nom, sym } from "./sym";
import { car, join, length, toArray } from "./pair";
import { Continuation } from "./continuation";
import { Environment, VariableEnv, extendEnv } from "./environment";

import { evaluateBegin } from "./begin";

export abstract class Value {
  abstract invoke(vx: BelT, r: Environment, k: Continuation): void;
}

type Invokeable = (vx: BelT, _: Environment, k: Continuation) => void;

export class Fn extends Value {
  variables: BelT;
  body: BelT;
  env: Environment;

  constructor(variables: BelT, body: BelT, env: Environment) {
    super();

    this.variables = variables;
    this.body = body;
    this.env = env;
  }

  invoke(vx: BelT, _: Environment, k: Continuation): void {
    let env = extendEnv(this.env as VariableEnv, this.variables, vx);
    evaluateBegin(this.body, env, k);
  }
}

export class Primitive extends Value {
  name: symbol;
  address: Invokeable;

  constructor(name: symbol, address: Invokeable) {
    super();

    this.name = name;
    this.address = address;
  }

  invoke(vx: BelT, r: Environment, k: Continuation): void {
    this.address(vx, r, k);
  }
}

export const ccc = new Primitive(sym("ccc"), function(
  vx: BelT,
  r: Environment,
  k: Continuation
) {
  const p: Pair = vx as Pair;

  if (length(p) === 1) {
    (car(p) as Value).invoke(join(k, null), r, k);
    return;
  }

  throw new Error("bad arity: ccc");
});

export function jsPrimitive(
  name: symbol,
  value: any,
  arity: number
): Primitive {
  return new Primitive(name, function(
    vx: BelT,
    _: Environment,
    k: Continuation
  ) {
    let args: BelT[] = toArray(vx as Pair);

    if (args.length === arity) {
      k.resume(value.apply(null, args));
      return;
    }

    throw new Error("bad arity: " + nom(name));
  });
}

export function fn(x: BelT): boolean {
  return x instanceof Fn;
}
