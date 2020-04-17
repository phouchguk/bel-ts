import { createReadStream } from "fs";
import { bel } from "./boot";

function gotExp(exp: string): void {
  console.log("expression", exp);
}

function gotResult(result: string): void {
  console.log("result", result);
}

const readStream = createReadStream("prelude.bel", "utf8");
readStream
  .on("data", function(chunk: string | Buffer) {
    bel(chunk as string, gotExp, gotResult);
  })
  .on("end", function() {
    /*
bel(
  "(set double (macro (x) (join '* (join x (join x nil))))) (double 7)",
  gotExp
);
*/

    bel(
      '(set double (macro (x) (join \'* (join x (join x nil))))) (set x 30) 1 2 (display "done") (iff (coin) ((fn (x) x) (+ x 12)) (ccc (fn (return) (iff (coin) (return (- 100 1)) 3)))) (double 7) (no (double 9)) (no nil) (no t)',
      gotExp,
      gotResult
    );

    //bel("x|~f:g!a", gotExp);

    //bel("((fn (a (b c) d e) (+ a (+ b (+ c (+ d e))))) 1 '(2 3) 4 5)", gotExp);
  });
