import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const useShell = process.platform === "win32";

/**
 * Run a command; resolve true on exit 0, false otherwise (no thrown errors).
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }} [options]
 */
export async function commandSucceeds(command, args, options = {}) {
  const { cwd, env, timeoutMs = 15_000 } = options;
  try {
    await execFileAsync(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      timeout: timeoutMs,
      shell: useShell,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command and inherit stdio. Rejects on non-zero exit.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string; env?: NodeJS.ProcessEnv }} [options]
 */
export function run(command, args, options = {}) {
  const { cwd, env } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      stdio: "inherit",
      shell: useShell,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
      }
    });
  });
}
