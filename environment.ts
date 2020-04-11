import { nom } from "./sym";
import { Continuation } from "./continuation";

export abstract class Environment {
  abstract lookup(n: symbol, k: Continuation): void;
}

export class NullEnv extends Environment {
  lookup(n: symbol, _: Continuation) {
    throw new Error("Unknown variable: " + nom(n));
  }
}

export const theEmptyEnvironment = new NullEnv();
