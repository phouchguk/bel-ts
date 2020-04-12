import { BelT } from "./type";
import { Continuation } from "./continuation";
import { Environment, VariableEnv, extendEnv } from "./environment";

import { evaluateBegin } from "./begin";

export abstract class Value {
  abstract invoke(vx: BelT, r: Environment, k: Continuation): void;
}

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

export function fn(x: BelT): boolean {
  return x instanceof Fn;
}
