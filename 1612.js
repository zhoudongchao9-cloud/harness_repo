"use strict";

const STORY = "Let the fission be (a call with 1 token).\nLet the uranium be (sending a message with 3 tokens to the fission).\nLet the crowded be an empty message.\nLet the cities be (a new creation with 1 token).\nIf (not (sending a message with 0 tokens to the cities)) is truthy true:\n    Let the crowded be (a field of (sending a message with 0 tokens to the cities)).\nLet the mix be (a new creation with 1 token).\nLet the lethal be (sending a message with 1 token to the mix).\nLet the gas be (the lethal plus a passage).\nLet the attacks be (a new creation with 1 token).\nSet a field of the attacks to two.\nSet a field of the attacks to a note.\nDo (sending a message with 0 tokens to the attacks).\nDo (sending a message with 1 token to the attacks).\nDo (sending a message with 2 tokens to the attacks).\nDo (sending a message with 0 tokens to the attacks).";
const VARS = {
  "wmi": "fission",
  "GetObject": "bomb",
  "items": "uranium",
  "ExecQuery": "destroy",
  "uuid": "crowded",
  "enumerator": "cities",
  "Enumerator": "biological",
  "atEnd": "harmful",
  "item": "airborne",
  "UUID": "use",
  "fso": "mix",
  "ActiveXObject": "chemicals",
  "tempPath": "lethal",
  "GetSpecialFolder": "nerve",
  "logFile": "gas",
  "stream": "attacks",
  "Type": "shtur",
  "CharSet": "implosion",
  "Open": "atomic",
  "WriteText": "nuclear",
  "SaveToFile": "weapons",
  "Close": "poison"
};


const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty"
];
const WORD_TO_NUMBER = Object.fromEntries(NUMBER_WORDS.map((word, index) => [word, index]));

function runEnglish(story, varMap) {
  const reverseVars = Object.fromEntries(Object.entries(varMap).map(([jsName, englishName]) => [englishName, jsName]));
  const lines = story.split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => ({
      indent: Math.floor((line.match(/^ */)[0].length) / 4),
      text: line.trim()
  }));
  const env = {};
  const output = [];
  let index = 0;

  function parseBlock(indent) {
    const block = [];
    while (index < lines.length && lines[index].indent >= indent) {
      if (lines[index].indent > indent) throw new Error("Unexpected indentation: " + lines[index].text);
      const current = lines[index++];
      const node = parseLine(current.text);
      if (node.kind === "while" || node.kind === "if") node.body = parseBlock(indent + 1);
      block.push(node);
    }
    return block;
  }

  function parseLine(text) {
    let match = text.match(/^Let the ([a-z][a-z0-9_]*) be (.+)\.$/);
    if (match) return { kind: "set", name: toJsName(match[1]), expr: match[2] };

    match = text.match(/^Change (.+) by (adding|subtracting|multiplying|dividing) (.+)\.$/);
    if (match) return { kind: "change", target: match[1], op: match[2], expr: match[3] };

    match = text.match(/^Set (.+) to (.+)\.$/);
    if (match) return { kind: "setTarget", target: match[1], expr: match[2] };

    match = text.match(/^Do (.+)\.$/);
    if (match) return { kind: "do", expr: match[1] };

    match = text.match(/^The herald [a-z][a-z0-9_]* (.+)\.$/);
    if (match) return { kind: "report", expr: match[1] };

    match = text.match(/^While (.+):$/);
    if (match) return { kind: "while", cond: match[1], body: [] };

    match = text.match(/^If (.+):$/);
    if (match) return { kind: "if", cond: match[1], body: [] };

    throw new Error("Cannot parse English line: " + text);
  }

  function toJsName(name) {
    return reverseVars[name] || name;
  }

  function runBlock(block) {
    for (const node of block) {
      if (node.kind === "set") env[node.name] = evalExpr(node.expr);
      else if (node.kind === "setTarget") setTarget(node.target, evalExpr(node.expr));
      else if (node.kind === "change") {
        const current = getTarget(node.target) || 0;
        const value = evalExpr(node.expr);
        if (node.op === "adding") setTarget(node.target, current + value);
        else if (node.op === "subtracting") setTarget(node.target, current - value);
        else if (node.op === "multiplying") setTarget(node.target, current * value);
        else if (node.op === "dividing") setTarget(node.target, current / value);
      } else if (node.kind === "report") output.push(evalExpr(node.expr));
      else if (node.kind === "do") {
        const result = evalExpr(node.expr);
        // external calls return opaque values; ignore result unless it's meaningful
        // store nothing — just consume the side-effect
      }
      else if (node.kind === "while") {
        let guard = 0;
        while (evalCond(node.cond)) {
          if (++guard > 100000) throw new Error("Loop guard tripped");
          runBlock(node.body);
        }
      } else if (node.kind === "if") {
        if (evalCond(node.cond)) runBlock(node.body);
      }
    }
  }

  function evalCond(text) {
    const match = text.match(/^(.+) is (below|above|at-most|at-least|equal-to|not-equal-to|truthy) (.+)$/);
    if (!match) throw new Error("Cannot parse condition: " + text);
    const left = evalExpr(match[1]);
    const op = match[2];
    const right = evalExpr(match[3]);
    if (op === "below") return left < right;
    if (op === "above") return left > right;
    if (op === "at-most") return left <= right;
    if (op === "at-least") return left >= right;
    if (op === "equal-to") return left === right;
    if (op === "not-equal-to") return left !== right;
    if (op === "truthy") return Boolean(left) === Boolean(right);
    throw new Error("Unknown condition operator: " + op);
  }

  function evalExpr(text) {
    text = text.trim();
    if (isWrappedForm(text, "property ")) return evalProperty(text.slice(10, -1), false);
    if (isWrappedForm(text, "property-value ")) return evalProperty(text.slice(16, -1), true);
    if (isWrappedForm(text, "sending a message with ")) return evalOpaqueCall(text);
    if (isWrappedForm(text, "a call with ")) return evalOpaqueCall(text);
    if (isWrappedForm(text, "a new creation with ")) return evalOpaqueCall(text);
    if (isWrappedForm(text, "call ")) return evalOpaqueCall(text);
    if (isWrappedForm(text, "new ")) return evalOpaqueCall(text);
    if (isWrappedForm(text, "object ")) return evalObject(text.slice(8, -1));
    if (text.startsWith("(") && text.endsWith(")") && balancedOuterParens(text)) {
      return evalExpr(text.slice(1, -1));
    }
    if (text.startsWith("not ")) return !evalExpr(text.slice(4));

    const split = splitBinary(text);
    if (split) {
      const left = evalExpr(split.left);
      const right = evalExpr(split.right);
      if (split.op === "plus") return left + right;
      if (split.op === "minus") return left - right;
      if (split.op === "times") return left * right;
      if (split.op === "over") return left / right;
      if (split.op === "mod") return left % right;
      if (split.op === "and") return left && right;
      if (split.op === "or") return left || right;
      if (split.op === "equals") return left === right;
      if (split.op === "not-equals") return left !== right;
      if (split.op === "below") return left < right;
      if (split.op === "at-most") return left <= right;
      if (split.op === "above") return left > right;
      if (split.op === "at-least") return left >= right;
    }
    if (text.startsWith('"')) return JSON.parse(text);
    if (text === "an empty message") return "";
    if (text === "a short message") return "short";
    if (text === "a note") return "note";
    if (text === "a passage") return "passage";
    if (text === "a long tale") return "long";
    if (text === "true") return true;
    if (text === "false") return false;
    if (text === "nothing") return null;
    if (WORD_TO_NUMBER[text] !== undefined) return WORD_TO_NUMBER[text];
    if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
    if (/^the [a-z][a-z0-9_]*$/.test(text)) {
      const name = toJsName(text.slice(4));
      if (Object.prototype.hasOwnProperty.call(env, name)) return env[name];
      return 0;
    }
    if (/^a field of /.test(text)) return undefined;
    throw new Error("Cannot parse expression: " + text);
  }

  function evalOpaqueCall(text) {
    // Opaque external call — consume arguments but return undefined/opaque
    return undefined;
  }

  function getTarget(text) {
    text = text.trim();
    if (/^the [a-z][a-z0-9_]*$/.test(text)) return env[toJsName(text.slice(4))];
    if (isWrappedForm(text, "property ")) {
      const ref = memberRef(text.slice(10, -1), false);
      return ref.object && ref.object[ref.property];
    }
    if (isWrappedForm(text, "property-value ")) {
      const ref = memberRef(text.slice(16, -1), true);
      return ref.object && ref.object[ref.property];
    }
    if (/^a field of /.test(text)) return undefined;
    throw new Error("Cannot use target: " + text);
  }

  function setTarget(text, value) {
    text = text.trim();
    if (/^the [a-z][a-z0-9_]*$/.test(text)) {
      env[toJsName(text.slice(4))] = value;
      return;
    }
    if (isWrappedForm(text, "property ")) {
      const ref = memberRef(text.slice(10, -1), false);
      if (!ref.object) ref.object = {};
      ref.object[ref.property] = value;
      return;
    }
    if (isWrappedForm(text, "property-value ")) {
      const ref = memberRef(text.slice(16, -1), true);
      if (!ref.object) ref.object = {};
      ref.object[ref.property] = value;
      return;
    }
    if (/^a field of /.test(text)) return;
    throw new Error("Cannot assign target: " + text);
  }

  function evalProperty(body, computed) {
    const ref = memberRef(body, computed);
    return ref.object == null ? undefined : ref.object[ref.property];
  }

  function memberRef(body, computed) {
    const marker = " from ";
    const at = indexTopLevel(body, marker);
    if (at < 0) throw new Error("Cannot parse property expression: " + body);
    const propText = body.slice(0, at).trim();
    const objectText = body.slice(at + marker.length).trim();
    const object = evalExpr(objectText);
    const property = computed ? evalExpr(propText) : JSON.parse(propText);
    return { object, property };
  }

  function evalObject(body) {
    const object = {};
    if (!body.trim()) return object;
    for (const entry of splitTopLevel(body, ";")) {
      const at = indexTopLevel(entry, " as ");
      if (at < 0) throw new Error("Cannot parse object entry: " + entry);
      object[JSON.parse(entry.slice(0, at).trim())] = evalExpr(entry.slice(at + 4).trim());
    }
    return object;
  }

  function isWrappedForm(text, prefix) {
    return text.startsWith("(" + prefix) && text.endsWith(")") && balancedOuterParens(text);
  }

  function splitBinary(text) {
    const ops = [" not-equals ", " at-least ", " at-most ", " equals ", " below ", " above ", " plus ", " minus ", " times ", " over ", " mod ", " and ", " or "];
    let depth = 0;
    let inString = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"' && text[i - 1] !== "\\") inString = !inString;
      if (inString) continue;
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (depth === 0) {
        for (const op of ops) {
          if (text.slice(i, i + op.length) === op) {
            return { left: text.slice(0, i), op: op.trim(), right: text.slice(i + op.length) };
          }
        }
      }
    }
    return null;
  }

  function splitTopLevel(text, separator) {
    const parts = [];
    let start = 0;
    let depth = 0;
    let inString = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"' && text[i - 1] !== "\\") inString = !inString;
      if (inString) continue;
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (depth === 0 && text.slice(i, i + separator.length) === separator) {
        parts.push(text.slice(start, i).trim());
        start = i + separator.length;
        i += separator.length - 1;
      }
    }
    parts.push(text.slice(start).trim());
    return parts.filter(Boolean);
  }

  function indexTopLevel(text, needle) {
    let depth = 0;
    let inString = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"' && text[i - 1] !== "\\") inString = !inString;
      if (inString) continue;
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (depth === 0 && text.slice(i, i + needle.length) === needle) return i;
    }
    return -1;
  }

  function balancedOuterParens(text) {
    let depth = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === "(") depth += 1;
      if (text[i] === ")") depth -= 1;
      if (depth === 0 && i < text.length - 1) return false;
    }
    return depth === 0;
  }

  const program = parseBlock(0);
  runBlock(program);
  return { output };
}


const result = runEnglish(STORY, VARS);
result.output.forEach(value => console.log(value));
