(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
const continuation_1 = require("./continuation");
const value_1 = require("./value");
const bel_1 = require("./bel");
const print_1 = require("./print");
function applyArgs(args) {
    let rev = null;
    while (true) {
        if (pair_1.cdr(args) === null) {
            if (!pair_1.pair(pair_1.car(args))) {
                throw new Error("last arg to apply must be a pair");
            }
            args = pair_1.car(args);
            while (rev !== null) {
                args = pair_1.join(pair_1.car(rev), args);
                rev = pair_1.cdr(rev);
            }
            break;
        }
        else {
            rev = pair_1.join(pair_1.car(args), rev);
            args = pair_1.cdr(args);
        }
    }
    return args;
}
class ApplyCont extends continuation_1.Continuation {
    constructor(k, f, r) {
        super(k);
        this.f = f;
        this.r = r;
    }
    resume(args) {
        if (this.f === sym_1.sym("apply")) {
            this.f = pair_1.car(args);
            args = applyArgs(pair_1.cdr(args));
        }
        this.f.invoke(args, this.r, this.k);
    }
}
class ArgumentCont extends continuation_1.Continuation {
    constructor(k, remaining, r) {
        super(k);
        this.remaining = remaining;
        this.r = r;
    }
    resume(arg) {
        evaluateArguments(pair_1.cdr(this.remaining), this.r, new GatherCont(this.k, arg));
    }
}
class MacroCont extends continuation_1.Continuation {
    constructor(k, r) {
        super(k);
        this.r = r;
    }
    resume(expanded) {
        print_1.pr("macro", expanded);
        bel_1.evaluate(expanded, this.r, this.k);
    }
}
class EvFnCont extends continuation_1.Continuation {
    constructor(k, args, r) {
        super(k);
        this.args = args;
        this.r = r;
    }
    resume(op) {
        if (value_1.macro(op)) {
            let m = op;
            m.invoke(this.args, this.r, new MacroCont(this.k, this.r));
        }
        else {
            evaluateArguments(this.args, this.r, new ApplyCont(this.k, op, this.r));
        }
    }
}
class GatherCont extends continuation_1.Continuation {
    constructor(k, arg) {
        super(k);
        this.arg = arg;
    }
    resume(args) {
        this.k.resume(pair_1.join(this.arg, args));
    }
}
const noMoreArguments = null;
function evaluateArguments(args, r, k) {
    if (pair_1.pair(args)) {
        bel_1.evaluate(pair_1.car(args), r, new ArgumentCont(k, args, r));
        return;
    }
    k.resume(noMoreArguments);
}
function evaluateApplication(op, args, r, k) {
    bel_1.evaluate(op, r, new EvFnCont(k, args, r));
}
exports.evaluateApplication = evaluateApplication;

},{"./bel":3,"./continuation":5,"./pair":8,"./print":10,"./sym":12,"./value":14}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pair_1 = require("./pair");
const continuation_1 = require("./continuation");
const bel_1 = require("./bel");
class BeginCont extends continuation_1.Continuation {
    constructor(k, ex, r) {
        super(k);
        this.ex = ex;
        this.r = r;
    }
    resume(_) {
        evaluateBegin(pair_1.cdr(this.ex), this.r, this.k);
    }
}
function evaluateBegin(ex, r, k) {
    if (pair_1.pair(ex)) {
        let p = ex;
        if (pair_1.pair(pair_1.cdr(p))) {
            bel_1.evaluate(pair_1.car(p), r, new BeginCont(k, p, r));
        }
        else {
            bel_1.evaluate(pair_1.car(p), r, k);
        }
        return;
    }
    k.resume(null);
}
exports.evaluateBegin = evaluateBegin;

},{"./bel":3,"./continuation":5,"./pair":8}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("./type");
const pair_1 = require("./pair");
const sym_1 = require("./sym");
const value_1 = require("./value");
const iff_1 = require("./iff");
const begin_1 = require("./begin");
const set_1 = require("./set");
const application_1 = require("./application");
function taggedList(x, tag) {
    return pair_1.pair(x) && pair_1.car(x) === tag;
}
const apply = sym_1.sym("apply");
const o = sym_1.sym("o");
const lit = sym_1.sym("lit");
const quote = sym_1.sym("quote");
const iff = sym_1.sym("iff");
const begin = sym_1.sym("do");
const set = sym_1.sym("set");
const lambda = sym_1.sym("fn");
const macro = sym_1.sym("macro");
function selfEvaluating(x) {
    return (x === null ||
        type_1.number(x) ||
        type_1.string(x) ||
        taggedList(x, lit) ||
        (sym_1.symbol(x) && (x === sym_1.t || x === o || x === apply)));
}
function evaluateQuote(v, _, k) {
    k.resume(v);
}
function evaluateVariable(n, r, k) {
    r.lookup(n, k);
}
function evaluateLambda(nx, ex, r, k) {
    k.resume(new value_1.Fn(nx, ex, r));
}
function evaluateMacro(nx, ex, r, k) {
    k.resume(new value_1.Macro(nx, ex, r));
}
function evaluate(e, r, k) {
    if (pair_1.atom(e)) {
        if (selfEvaluating(e)) {
            evaluateQuote(e, r, k);
            return;
        }
        evaluateVariable(e, r, k);
        return;
    }
    let p = e;
    switch (pair_1.car(p)) {
        case quote:
            evaluateQuote(pair_1.cadr(p), r, k);
            break;
        case iff:
            iff_1.evaluateIf(pair_1.cadr(p), pair_1.caddr(p), pair_1.cadddr(p), r, k);
            break;
        case begin:
            begin_1.evaluateBegin(pair_1.cdr(p), r, k);
            break;
        case set:
            set_1.evaluateSet(pair_1.cadr(p), pair_1.caddr(p), r, k);
            break;
        case lambda:
            evaluateLambda(pair_1.cadr(p), pair_1.cddr(p), r, k);
            break;
        case macro:
            evaluateMacro(pair_1.cadr(p), pair_1.cddr(p), r, k);
            break;
        default:
            application_1.evaluateApplication(pair_1.car(p), pair_1.cdr(p), r, k);
    }
}
exports.evaluate = evaluate;

},{"./application":1,"./begin":2,"./iff":7,"./pair":8,"./set":11,"./sym":12,"./type":13,"./value":14}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
const parse_1 = require("./parse");
const print_1 = require("./print");
const continuation_1 = require("./continuation");
const environment_1 = require("./environment");
const bel_1 = require("./bel");
const value_1 = require("./value");
const baseCont = new continuation_1.BaseCont(null, gotResult);
let env = environment_1.initialEnvironment;
function prim(name, f, arity) {
    let s = sym_1.sym(name);
    env = new environment_1.VariableEnv(env, s, value_1.jsPrimitive(s, f, arity));
}
const t = sym_1.sym("t");
prim("+", (a, b) => a + b, 2);
prim("-", (a, b) => a - b, 2);
prim("*", (a, b) => a * b, 2);
prim("/", (a, b) => a / b, 2);
prim("id", (a, b) => (a === b ? t : null), 2);
prim("join", pair_1.join, 2);
prim("car", pair_1.car, 1);
prim("cdr", pair_1.cdr, 1);
prim("xar", pair_1.xar, 2);
prim("xdr", pair_1.xdr, 2);
prim("sym", sym_1.sym, 1);
prim("nom", sym_1.nom, 1);
prim("coin", () => (Math.random() * 2 > 1 ? t : null), 0);
prim("display", (s) => {
    console.log(s);
    return s;
}, 1);
env = new environment_1.VariableEnv(env, sym_1.sym("ccc"), value_1.ccc);
function equal(e1, e2) {
    if (pair_1.pair(e1)) {
        if (!pair_1.pair(e2)) {
            return false;
        }
        const p1 = e1;
        const p2 = e2;
        return equal(pair_1.car(p1), pair_1.car(p2)) && equal(pair_1.cdr(p1), pair_1.cdr(p2));
    }
    else {
        return e1 === e2;
    }
}
function expandSymbol(sm) {
    let s = sym_1.nom(sm);
    if (s.indexOf("|") > -1) {
        const parts = s.split("|");
        return pair_1.join(t, pair_1.join(sym_1.sym(parts[0]), pair_1.join(sym_1.sym(parts[1]), null)));
    }
    if (s.indexOf(".") > -1 || s.indexOf("!") > -1) {
        let upon = false;
        let bang = s[0] === "!";
        if (s[0] === "." || bang) {
            upon = true;
            s = s.substring(1);
        }
        const splitters = s.split("").filter(s => s === "." || s === "!");
        const parts = s.split(/[!\.]/);
        let result = null;
        for (let i = parts.length - 1; i >= 0; i--) {
            let psm = sym_1.sym(parts[i]);
            if (i > 0 && splitters[i - 1] === "!") {
                psm = pair_1.join(sym_1.sym("quote"), pair_1.join(psm, null));
            }
            result = pair_1.join(psm, result);
        }
        if (upon) {
            if (bang) {
                result = pair_1.join(sym_1.sym("quote"), result);
                return pair_1.join(sym_1.sym("upon"), pair_1.join(result, null));
            }
            else {
                return pair_1.join(sym_1.sym("upon"), result);
            }
        }
        else {
            return result;
        }
    }
    if (s.indexOf(":") > -1) {
        const parts = s.split(":");
        let result = null;
        for (let i = parts.length - 1; i >= 0; i--) {
            let psm = sym_1.sym(parts[i]);
            result = pair_1.join(psm, result);
        }
        return pair_1.join(sym_1.sym("compose"), result);
    }
    if (s[0] === "~") {
        return pair_1.join(sym_1.sym("compose"), pair_1.join(sym_1.sym("no"), pair_1.join(sym_1.sym(s.substring(1)), null)));
    }
    return sm;
}
function expand(exp) {
    let lastExp = null;
    while (true) {
        if (equal(exp, lastExp)) {
            return exp;
        }
        lastExp = exp;
        if (pair_1.pair(exp)) {
            let p = exp;
            while (p !== null) {
                pair_1.xar(p, expand(pair_1.car(p)));
                const d = pair_1.cdr(p);
                if (d === null || pair_1.pair(d)) {
                    p = d;
                    continue;
                }
                pair_1.xdr(p, expand(d));
                break;
            }
        }
        else {
            if (sym_1.symbol(exp)) {
                exp = expandSymbol(exp);
                continue;
            }
        }
    }
}
let errOut = null;
let expOut = null;
let resOut = null;
function gotExp(exp) {
    if (expOut !== null) {
        print_1.prs(exp, expOut);
    }
    gotExpansion(expand(exp));
}
function gotExpansion(exp) {
    try {
        bel_1.evaluate(exp, env, baseCont);
    }
    catch (e) {
        if (errOut !== null) {
            errOut(e);
        }
    }
}
function gotResult(result) {
    if (resOut !== null) {
        resOut(result);
    }
}
function bel(s, err, exp, res) {
    errOut = err;
    expOut = exp;
    resOut = res;
    parse_1.parse(s, gotExp);
}
exports.bel = bel;

},{"./bel":3,"./continuation":5,"./environment":6,"./pair":8,"./parse":9,"./print":10,"./sym":12,"./value":14}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pair_1 = require("./pair");
class Continuation {
    constructor(k) {
        this.k = k;
    }
    invoke(vx, _r, _k) {
        if (pair_1.length(vx) === 1) {
            this.resume(pair_1.car(vx));
            return;
        }
        throw new Error("continuations expect 1 argument");
    }
}
exports.Continuation = Continuation;
class BaseCont extends Continuation {
    constructor(k, f) {
        super(k);
        this.f = f;
    }
    resume(v) {
        this.f(v);
    }
}
exports.BaseCont = BaseCont;

},{"./pair":8}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
class Environment {
}
exports.Environment = Environment;
class NullEnv extends Environment {
    lookup(n, _) {
        throw new Error("Unknown variable: " + sym_1.nom(n));
    }
    update(n, _k, _v) {
        throw new Error("unknown variable: " + sym_1.nom(n));
    }
}
exports.NullEnv = NullEnv;
const theEmptyEnvironment = new NullEnv();
class FullEnv extends Environment {
    constructor(other, name) {
        super();
        this.other = other;
        this.name = name;
    }
}
exports.FullEnv = FullEnv;
class VariableEnv extends FullEnv {
    constructor(other, name, value) {
        super(other, name);
        this.value = value;
    }
    lookup(n, k) {
        if (this.name === n) {
            k.resume(this.value);
            return;
        }
        this.other.lookup(n, k);
    }
    update(n, k, v) {
        if (this.name === n) {
            this.value = v;
            k.resume(v);
            return;
        }
        if (this.other === theEmptyEnvironment) {
            this.other = new VariableEnv(theEmptyEnvironment, n, v);
            k.resume(v);
            return;
        }
        this.other.update(n, k, v);
    }
}
exports.VariableEnv = VariableEnv;
exports.initialEnvironment = new VariableEnv(theEmptyEnvironment, sym_1.sym("version"), 0.1);
function extendEnv(env, names, values) {
    if (pair_1.pair(names) && pair_1.pair(values)) {
        let n = pair_1.car(names);
        let v = pair_1.car(values);
        let rest = extendEnv(env, pair_1.cdr(names), pair_1.cdr(values));
        if (sym_1.symbol(n)) {
            return new VariableEnv(rest, n, v);
        }
        if (pair_1.pair(n)) {
            return extendEnv(rest, n, v);
        }
        throw new Error("invalid parameter");
    }
    if (names === null && values === null) {
        return env;
    }
    if (sym_1.symbol(names)) {
        return new VariableEnv(env, names, values);
    }
    throw new Error("Arity mismatch -- EXTENDENV");
}
exports.extendEnv = extendEnv;

},{"./pair":8,"./sym":12}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const continuation_1 = require("./continuation");
const bel_1 = require("./bel");
class IfCont extends continuation_1.Continuation {
    constructor(k, et, ef, r) {
        super(k);
        this.et = et;
        this.ef = ef;
        this.r = r;
    }
    resume(v) {
        bel_1.evaluate(v === null ? this.ef : this.et, this.r, this.k);
    }
}
function evaluateIf(ec, et, ef, r, k) {
    bel_1.evaluate(ec, r, new IfCont(k, et, ef, r));
}
exports.evaluateIf = evaluateIf;

},{"./bel":3,"./continuation":5}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("./type");
const sym_1 = require("./sym");
function join(a, d) {
    return new type_1.Cell(a, d);
}
exports.join = join;
function car(p) {
    if (p === null) {
        return null;
    }
    return p.a;
}
exports.car = car;
function cdr(p) {
    if (p === null) {
        return null;
    }
    return p.d;
}
exports.cdr = cdr;
function xar(p, a) {
    p.a = a;
    return a;
}
exports.xar = xar;
function xdr(p, d) {
    p.d = d;
    return d;
}
exports.xdr = xdr;
function pair(x) {
    return x instanceof type_1.Cell;
}
exports.pair = pair;
function atom(x) {
    return !pair(x);
}
exports.atom = atom;
function cadr(e) {
    return car(cdr(e));
}
exports.cadr = cadr;
function caddr(e) {
    return car(cdr(cdr(e)));
}
exports.caddr = caddr;
function cadddr(e) {
    return car(cdr(cdr(cdr(e))));
}
exports.cadddr = cadddr;
function cddr(e) {
    return cdr(cdr(e));
}
exports.cddr = cddr;
function toArray(xs) {
    let arr = [];
    let i = 0;
    while (xs !== null) {
        arr[i++] = car(xs);
        xs = cdr(xs);
    }
    return arr;
}
exports.toArray = toArray;
function length(xs) {
    let len = 0;
    while (xs !== null) {
        len++;
        xs = cdr(xs);
    }
    return len;
}
exports.length = length;
function bquote(x) {
    if (pair(x)) {
        const p = x;
        if (car(p) === sym_1.sym("comma")) {
            return car(cdr(p));
        }
        else {
            let qCdr = join(sym_1.sym("bquote"), join(cdr(p), null));
            if (pair(car(p)) && car(car(p)) === sym_1.sym("comma-at")) {
                return join(sym_1.sym("append"), join(car(cdr(car(p))), join(qCdr, null)));
            }
            else {
                return join(sym_1.sym("join"), join(join(sym_1.sym("bquote"), join(car(p), null)), join(qCdr, null)));
            }
        }
    }
    else {
        return join(sym_1.sym("quote"), join(x, null));
    }
}
exports.bquote = bquote;

},{"./sym":12,"./type":13}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
let send = null;
const token = [];
const nrRe = /^-?[0-9][0-9\.]*$/;
function parse(s, callback) {
    send = callback;
    const chars = s.split("");
    for (let i = 0; i < chars.length; i++) {
        parseChar(chars[i]);
    }
    if (token.length > 0) {
        parseToken(token.join(""));
        token.length = 0;
    }
}
exports.parse = parse;
let comment = false;
let improper = false;
let expectClose = false;
let inStr = false;
let strEscape = false;
let comma = false;
function parseChar(c) {
    if (inStr) {
        if (strEscape) {
            strEscape = false;
            switch (c) {
                case '"':
                    token.push(c);
                    return;
                case "r":
                    token.push("\r");
                    return;
                case "n":
                    token.push("\n");
                    return;
                case "t":
                    token.push("\t");
                    return;
                default:
                    throw new Error("unrecognised escape sequence \\" + c);
            }
        }
        if (c === "\\") {
            strEscape = true;
            return;
        }
        token.push(c);
        if (c === '"') {
            inStr = false;
            parseToken(token.join(""));
            token.length = 0;
        }
    }
    else {
        if (comment) {
            if (c === "\n") {
                comment = false;
            }
            return;
        }
        if (c.trim() === "") {
            if (token.length > 0) {
                parseToken(token.join(""));
                token.length = 0;
            }
            return;
        }
        if (comma) {
            comma = false;
            if (c === "@") {
                quoteNext = ",@";
            }
            else {
                quoteNext = ",";
                parseChar(c);
            }
            return;
        }
        if (c === '"') {
            inStr = true;
            token.push(c);
            return;
        }
        if (c === "(" ||
            c === ")" ||
            c === "'" ||
            c === "`" ||
            c === "`" ||
            c === "," ||
            c === ";") {
            if (token.length > 0) {
                parseToken(token.join(""));
                token.length = 0;
            }
            if (c === ";") {
                comment = true;
                return;
            }
            if (c === ",") {
                comma = true;
                return;
            }
            if (c === "(" || c === ")") {
                parseToken(c);
            }
            else {
                quoteNext = c;
            }
        }
        else {
            token.push(c);
        }
    }
}
let listStack = null;
let quoteStack = null;
function pushLs(x) {
    let list = pair_1.car(listStack);
    list = pair_1.join(x, list);
    listStack = pair_1.join(list, pair_1.cdr(listStack));
}
let quoteNext = "";
function quote(q) {
    switch (q) {
        case "'":
            return sym_1.sym("quote");
        case "`":
            return sym_1.sym("bquote");
        case ",":
            return sym_1.sym("comma");
        case ",@":
            return sym_1.sym("comma-at");
        default:
            throw new Error("unrecognised quote: " + q);
    }
}
function parseToken(token) {
    if (token === "(") {
        if (expectClose) {
            throw new Error("bad '('");
        }
        listStack = pair_1.join(null, listStack);
        quoteStack = pair_1.join(quoteNext, quoteStack);
        quoteNext = "";
        return;
    }
    if (token === ".") {
        if (listStack === null || improper || expectClose) {
            throw new Error("bad '.'");
        }
        else {
            improper = true;
            return;
        }
    }
    if (token === ")") {
        if (listStack === null) {
            throw new Error("bad ')'");
        }
        else if (improper && !expectClose) {
            throw new Error("bad '.'");
        }
        else {
            let q = pair_1.car(quoteStack);
            quoteStack = pair_1.cdr(quoteStack);
            let list = pair_1.car(listStack);
            listStack = pair_1.cdr(listStack);
            let xs = null;
            while (list !== null) {
                xs = pair_1.join(pair_1.car(list), xs);
                list = pair_1.cdr(list);
            }
            if (expectClose) {
                list = xs;
                while (list !== null) {
                    if (pair_1.cddr(list) === null) {
                        pair_1.xdr(list, pair_1.cadr(list));
                        improper = false;
                        expectClose = false;
                        break;
                    }
                    list = pair_1.cdr(list);
                }
            }
            if (q !== "") {
                xs = pair_1.join(quote(q), pair_1.join(xs, null));
            }
            if (listStack === null) {
                send(xs);
            }
            else {
                pushLs(xs);
            }
        }
        return;
    }
    let atom = null;
    if (nrRe.test(token)) {
        const nr = parseFloat(token);
        if (isNaN(nr)) {
            throw new Error("unrecignised number: " + token);
        }
        atom = nr;
    }
    else {
        if (token.startsWith('"')) {
            atom = token
                .substring(1, token.length - 1)
                .replace(/\\"/g, '"')
                .replace(/\\\n/g, "\n")
                .replace(/\\\r/g, "\r")
                .replace(/\\\t/g, "\t");
        }
        else {
            if (token === "nil") {
                atom = null;
            }
            else {
                atom = sym_1.sym(token);
            }
        }
    }
    if (quoteNext.length > 0) {
        atom = pair_1.join(quote(quoteNext), pair_1.join(atom, null));
        quoteNext = "";
    }
    if (improper) {
        expectClose = true;
    }
    if (listStack === null) {
        send(atom);
    }
    else {
        pushLs(atom);
    }
}

},{"./pair":8,"./sym":12}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
const value_1 = require("./value");
function wrap(cls, val) {
    return `<span class="${cls}">${val}</span>`;
}
function prw(exp, output) {
    if (pair_1.pair(exp)) {
        output.push(wrap("par", "("));
        let xs = exp;
        let first = true;
        while (xs !== null) {
            if (!first) {
                output.push(" ");
            }
            if (pair_1.atom(xs)) {
                output.push(". ");
                prw(xs, output);
                break;
            }
            prw(pair_1.car(xs), output);
            xs = pair_1.cdr(xs);
            first = false;
        }
        output.push(wrap("par", ")"));
        return;
    }
    if (sym_1.symbol(exp)) {
        output.push(wrap("sym", sym_1.nom(exp)));
    }
    else if (value_1.fn(exp)) {
        output.push(wrap("unp", "&lt;fn&gt;"));
    }
    else if (value_1.macro(exp)) {
        output.push(wrap("unp", "&lt;macro&gt;"));
    }
    else if (value_1.prim(exp)) {
        output.push(wrap("unp", `&lt;prim:${sym_1.nom(exp.name)}&gt;`));
    }
    else if (exp === null) {
        output.push(wrap("sym", "nil"));
    }
    else if (typeof exp === "string") {
        output.push(wrap("str", '"' +
            exp
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n")
                .replace(/\t/g, "\\t")
                .replace(/\r/g, "\\r") +
            '"'));
    }
    else {
        output.push(wrap("num", exp + ""));
    }
}
exports.prw = prw;
function print(exp, output) {
    if (pair_1.pair(exp)) {
        output.push("(");
        let xs = exp;
        let first = true;
        while (xs !== null) {
            if (!first) {
                output.push(" ");
            }
            if (pair_1.atom(xs)) {
                output.push(". ");
                print(xs, output);
                break;
            }
            print(pair_1.car(xs), output);
            xs = pair_1.cdr(xs);
            first = false;
        }
        output.push(")");
        return;
    }
    if (sym_1.symbol(exp)) {
        output.push(sym_1.nom(exp));
    }
    else if (value_1.fn(exp)) {
        output.push("<fn>");
    }
    else if (value_1.macro(exp)) {
        output.push("<macro>");
    }
    else if (value_1.prim(exp)) {
        output.push(`<prim:${sym_1.nom(exp.name)}>`);
    }
    else if (exp === null) {
        output.push("nil");
    }
    else if (typeof exp === "string") {
        output.push('"' +
            exp
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n")
                .replace(/\t/g, "\\t")
                .replace(/\r/g, "\\r") +
            '"');
    }
    else {
        output.push(exp + "");
    }
}
exports.print = print;
function pr(got, x) {
    prs(x, function (s) {
        console.log(`${got}:`, s);
    });
}
exports.pr = pr;
function prs(x, f) {
    let output = [];
    print(x, output);
    if (output.length > 0) {
        f(output.join(""));
    }
}
exports.prs = prs;

},{"./pair":8,"./sym":12,"./value":14}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const continuation_1 = require("./continuation");
const bel_1 = require("./bel");
class SetCont extends continuation_1.Continuation {
    constructor(k, n, r) {
        super(k);
        this.n = n;
        this.r = r;
    }
    resume(v) {
        this.r.update(this.n, this.k, v);
    }
}
function evaluateSet(n, e, r, k) {
    bel_1.evaluate(e, r, new SetCont(k, n, r));
}
exports.evaluateSet = evaluateSet;

},{"./bel":3,"./continuation":5}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function nom(sym) {
    const s = sym.toString();
    return s.substring(7, s.length - 1);
}
exports.nom = nom;
function sym(s) {
    if (s === "nil") {
        throw new Error("can't create symbol 'nil'");
    }
    return Symbol.for(s);
}
exports.sym = sym;
function symbol(x) {
    return typeof x === "symbol";
}
exports.symbol = symbol;
exports.t = sym("t");

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cell {
    constructor(a, d) {
        this.a = a;
        this.d = d;
    }
}
exports.Cell = Cell;
function number(x) {
    return typeof x === "number";
}
exports.number = number;
function string(x) {
    return typeof x === "string";
}
exports.string = string;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sym_1 = require("./sym");
const pair_1 = require("./pair");
const environment_1 = require("./environment");
const begin_1 = require("./begin");
class Value {
}
exports.Value = Value;
class Fn extends Value {
    constructor(variables, body, env) {
        super();
        this.variables = variables;
        this.body = body;
        this.env = env;
    }
    invoke(vx, _, k) {
        let env = environment_1.extendEnv(this.env, this.variables, vx);
        begin_1.evaluateBegin(this.body, env, k);
    }
}
exports.Fn = Fn;
class Macro extends Value {
    constructor(variables, body, env) {
        super();
        this.variables = variables;
        this.body = body;
        this.env = env;
    }
    invoke(vx, _, k) {
        let env = environment_1.extendEnv(this.env, this.variables, vx);
        begin_1.evaluateBegin(this.body, env, k);
    }
}
exports.Macro = Macro;
class Primitive extends Value {
    constructor(name, address) {
        super();
        this.name = name;
        this.address = address;
    }
    invoke(vx, r, k) {
        this.address(vx, r, k);
    }
}
exports.Primitive = Primitive;
exports.ccc = new Primitive(sym_1.sym("ccc"), function (vx, r, k) {
    const p = vx;
    if (pair_1.length(p) === 1) {
        pair_1.car(p).invoke(pair_1.join(k, null), r, k);
        return;
    }
    throw new Error("bad arity: ccc");
});
function jsPrimitive(name, value, arity) {
    return new Primitive(name, function (vx, _, k) {
        let args = pair_1.toArray(vx);
        if (args.length === arity) {
            k.resume(value.apply(null, args));
            return;
        }
        throw new Error("bad arity: " + sym_1.nom(name));
    });
}
exports.jsPrimitive = jsPrimitive;
function fn(x) {
    return x instanceof Fn;
}
exports.fn = fn;
function macro(x) {
    return x instanceof Macro;
}
exports.macro = macro;
function prim(x) {
    return x instanceof Primitive;
}
exports.prim = prim;

},{"./begin":2,"./environment":6,"./pair":8,"./sym":12}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boot_1 = require("./boot");
const print_1 = require("./print");
const display = document.getElementById("display");
const repl = document.getElementById("repl");
repl.focus();
let idx = -1;
let cmds = [];
function say(c, s) {
    var p = document.createElement("p");
    p.className = c;
    p.innerText = s;
    display.appendChild(p);
}
function gotErr(err) {
    say("error", err);
}
function gotExp(exp) {
    say("input", exp);
}
function gotResult(exp) {
    let output = [];
    print_1.prw(exp, output);
    var p = document.createElement("p");
    p.className = "output";
    p.innerHTML = output.join("");
    display.appendChild(p);
}
function read(e) {
    if (cmds.length > 0) {
        if (e.keyCode === 38) {
            if (idx === -1) {
                idx = cmds.length - 1;
            }
            else {
                idx--;
            }
            if (idx < 0) {
                idx = cmds.length - 1;
            }
            repl.value = cmds[idx];
            return;
        }
        if (e.keyCode === 40) {
            if (idx === -1) {
                idx = 0;
            }
            else {
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
        const val = repl.value.trim();
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
        }
        else {
            boot_1.bel(val, gotErr, gotExp, gotResult);
        }
    }
}
repl.addEventListener("keyup", read, false);

},{"./boot":4,"./print":10}]},{},[15]);