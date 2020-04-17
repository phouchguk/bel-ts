import { createReadStream } from "fs";
import { BelT } from "./type";
import { bel } from "./boot";
import { prs } from "./print";

function gotErr(err: string): void {
  console.log("error", err);
}

function gotExp(exp: string): void {
  console.log("expression", exp);
}

function gotResult(exp: BelT): void {
  prs(exp, function(result) {
    console.log("result", result);
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

    bel(
      '(set double (macro (x) (join \'* (join x (join x nil))))) (set x 30) 1 2 (display "done") (iff (coin) ((fn (x) x) (+ x 12)) (ccc (fn (return) (iff (coin) (return (- 100 1)) 3)))) (double 7) (no (double 9)) (no nil) (no t) id (apply + \'(1 2))',
      gotErr,
      gotExp,
      gotResult
    );

    //bel("x|~f:g!a", gotExp);

    //bel("((fn (a (b c) d e) (+ a (+ b (+ c (+ d e))))) 1 '(2 3) 4 5)", gotExp);
  });
