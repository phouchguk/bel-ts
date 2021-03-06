import { createReadStream } from "fs";
import { BelT } from "./type";
import { bel } from "./boot";
import { prs } from "./print";

function gotErr(err: string): void {
  console.log(err);
}

function gotExp(exp: string): void {
  console.log(exp);
}

function gotResult(exp: BelT): void {
  prs(exp, function(result) {
    console.log(result);
    console.log();
  });
}

const readStream = createReadStream("prelude.bel", "utf8");
readStream
  .on("data", function(chunk: string | Buffer) {
    bel(chunk as string, gotErr, gotExp, gotResult);
  })
  .on("end", function() {
    /*
    bel(
      "(set double (macro (x) (join '* (join x (join x nil))))) (double 7)",
      gotExp
    );
    */

    bel("'ok", gotErr, gotExp, gotResult);

    //bel("x|~f:g!a", gotExp);

    //bel("((fn (a (b c) d e) (+ a (+ b (+ c (+ d e))))) 1 '(2 3) 4 5)", gotExp);
  });
