// Runs a command with a wall-clock limit, for experiments run during a shift:
//
//   node tools/timebox.mjs 600 uv run run.py
//
// Past the limit the command is stopped (SIGTERM, then SIGKILL) and this exits
// 124, like coreutils' timeout, which macOS doesn't have. An experiment that
// overruns its PLAN's budget is a result to report, not a wait: a shift that
// waits on it can run out its own time and lose the night.

import { spawn } from "node:child_process";

const [seconds, command, ...args] = process.argv.slice(2);
if (!Number(seconds) || !command) {
  console.error("usage: node tools/timebox.mjs SECONDS COMMAND [ARGS…]");
  process.exit(2);
}
const child = spawn(command, args, { stdio: "inherit" });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error(`timebox: stopped after ${seconds}s`);
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 5000).unref();
}, Number(seconds) * 1000);
child.on("exit", (code, signal) => {
  clearTimeout(timer);
  process.exit(timedOut ? 124 : code ?? (signal ? 128 : 1));
});
child.on("error", (error) => {
  console.error(`timebox: ${error.message}`);
  process.exit(127);
});
