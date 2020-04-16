var display = document.getElementById("display");

var repl = document.getElementById("repl");
repl.focus();

var idx = -1;

var cmds = [];

function say(c, s) {
  var p = document.createElement("p");
  p.className = c;
  p.innerText = s;
  display.appendChild(p);
}

function read(e) {
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
    var val = e.target.value.trim();
    e.target.value = "";

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
      say("input", val);
      say("output", "???");
    }
  }
}

repl.addEventListener("keyup", read, false);
