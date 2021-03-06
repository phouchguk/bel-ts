import { bel } from "./boot";
import { prw } from "./print";
import { BelT } from "./type";

const display: HTMLElement = document.getElementById("display") as HTMLElement;

const repl: HTMLInputElement = document.getElementById(
  "repl"
) as HTMLInputElement;
repl.focus();

let idx: number = -1;

let cmds: string[] = [];

function say(c: string, s: string): void {
  var p = document.createElement("p");
  p.className = c;
  p.innerText = s;
  display.appendChild(p);
}

function gotErr(err: string): void {
  say("error", err);
}

function gotExp(exp: string): void {
  say("input", exp);
}

function gotResult(exp: BelT): void {
  let output: string[] = [];

  prw(exp, output);

  var p = document.createElement("p");
  p.className = "output";
  p.innerHTML = output.join("");
  display.appendChild(p);
}

function read(e: KeyboardEvent): void {
  if (cmds.length > 0) {
    if (e.keyCode === 38) {
      // previous command
      if (idx === -1) {
        idx = cmds.length - 1;
      } else {
        idx--;
      }

      if (idx < 0) {
        idx = cmds.length - 1;
      }

      repl.value = cmds[idx];

      return;
    }

    if (e.keyCode === 40) {
      // next command

      if (idx === -1) {
        idx = 0;
      } else {
        idx++;
      }

      if (idx === cmds.length) {
        idx = 0;
      }

      repl.value = cmds[idx];

      return;
    }
  }

  if (e.keyCode === 13) {
    const val: string = repl.value.trim();
    repl.value = "";

    if (val === "") {
      return;
    }

    cmds.push(val);
    idx = -1;

    while (cmds.length > 50) {
      cmds.shift();
    }

    if (val === "(cls)") {
      display.innerText = "";
    } else {
      bel(val, gotErr, gotExp, gotResult);
    }
  }
}

const request = new XMLHttpRequest();
request.open("GET", "prelude.bel", true);

request.onload = function() {
  if (this.status >= 200 && this.status < 400) {
    bel(this.response, gotErr, gotExp, gotResult);
  } else {
    say("error", "could not load prelude");
  }
};

request.onerror = function() {
  say("error", "connection error");
};

request.send();

repl.addEventListener("keyup", read, false);
