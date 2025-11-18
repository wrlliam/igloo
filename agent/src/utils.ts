import { spawn } from "child_process";

export type CommandResult = {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: Error;  
  command: string; 
};

export async function runCommand(command: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn("bash", ["-c", command], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("error", (err) => {
      resolve({
        ok: false,
        exitCode: null,
        stdout,
        stderr,
        error: err,
        command,
      });
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        exitCode: code,
        stdout,
        stderr,
        command,
      });
    });
  });
}
