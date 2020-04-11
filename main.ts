import { nil, nom, sym, symbol } from "./sym";

const test: symbol = sym("hello");

console.log(symbol(test));
console.log(nom(test));
console.log(nil);
