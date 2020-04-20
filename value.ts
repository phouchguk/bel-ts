import { BelT, Pair } from "./type";
import { nom, sym } from "./sym";
import { car, join, length, toArray } from "./pair";
import { Continuation } from "./continuation";
import {
  Environment,
  VariableEnv,
  extendEnv,
  theEmptyEnvironment
} from "./environment";
import { evaluateBegin } from "./begin";
import { Next } from "./next";

export abstract class Value {
  abstract invoke(vx: BelT, k: Continuation): Next;
}

type Invokeable = (vx: BelT, k: Continuation) => Next;

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

  invoke(vx: BelT, k: Continuation): Next {
    let env = extendEnv(this.env as VariableEnv, this.variables, vx);
    return evaluateBegin(this.body, env, k);
  }
}

class K extends Fn {
  k: Continuation;

  constructor(k: Continuation) {
    super(null, null, theEmptyEnvironment);

    this.k = k;
  }

  invoke(vx: BelT, _: Continuation): Next {
    return new Next(this.k, car(vx as Pair));
  }
}

export class Macro extends Value {
  variables: BelT;
  body: BelT;
  env: Environment;

  constructor(variables: BelT, body: BelT, env: Environment) {
    super();

    this.variables = variables;
    this.body = body;
    this.env = env;
  }

  invoke(vx: BelT, k: Continuation): Next {
    let env = extendEnv(this.env as VariableEnv, this.variables, vx);
    return evaluateBegin(this.body, env, k);
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

  invoke(vx: BelT, k: Continuation): Next {
    return this.address(vx, k);
  }
}

export const ccc = new Primitive(sym("ccc"), function(
  vx: BelT,
  k: Continuation
) {
  const p: Pair = vx as Pair;

  if (length(p) === 1) {
    const f: Fn = car(p) as Fn;
    const args: BelT = join(new K(k), null);

    return f.invoke(args, k);
  }

  throw new Error("bad arity: ccc");
});

export function jsPrimitive(
  name: symbol,
  value: any,
  arity: number
): Primitive {
  return new Primitive(name, function(vx: BelT, k: Continuation) {
    let args: BelT[] = toArray(vx as Pair);

    if (args.length === arity) {
      return new Next(k, value.apply(null, args));
    }

    throw new Error("bad arity: " + nom(name));
  });
}

export function fn(x: BelT): boolean {
  return x instanceof Fn;
}

export function macro(x: BelT): boolean {
  return x instanceof Macro;
}

export function prim(x: BelT): boolean {
  return x instanceof Primitive;
}
