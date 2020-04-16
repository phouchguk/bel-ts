import { bel } from "./boot"

const display: HTMLElement = document.getElementById("display") as HTMLElement;

const repl: HTMLInputElement = document.getElementById("repl") as HTMLInputElement;
repl.focus();

let idx: number = -1;

let cmds: string[] = [];

function say(c: string, s:string): void {
  var p = document.createElement("p");
  p.className = c;
  p.innerText = s;
  display.appendChild(p);
}

function gotExp(exp: string): void {
  say("input", exp);
}

function gotResult(result: string): void {
  say("output", result);
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
        idx = 0
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
      bel(val, gotExp, gotResult);
    }
  }
}

repl.addEventListener("keyup", read, false);
