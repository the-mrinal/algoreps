import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm } from "fs/promises";
import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, input, language } = body as {
    code?: string;
    input?: string;
    language?: string;
  };

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "code is required and must be a string" },
      { status: 400 }
    );
  }

  const langConfig: Record<string, { file: string; command: string; args: (file: string) => string[] }> = {
    python3: { file: "solution.py", command: "python3", args: (f) => [f] },
    golang: { file: "solution.go", command: "go", args: (f) => ["run", f] },
  };

  const lang = language && langConfig[language] ? language : "python3";
  const config = langConfig[lang];

  const stdinInput = typeof input === "string" ? input : "";
  const execId = randomUUID();
  const execDir = join(tmpdir(), `dsa-run-${execId}`);
  const filePath = join(execDir, config.file);

  try {
    await mkdir(execDir, { recursive: true });
    await writeFile(filePath, code, "utf-8");

    const result = await executeCode(config.command, config.args(filePath), stdinInput);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected execution error";
    return NextResponse.json(
      { stdout: "", stderr: message, executionTime: 0, success: false },
      { status: 500 }
    );
  } finally {
    await rm(execDir, { recursive: true, force: true }).catch(() => {});
  }
}

function executeCode(
  command: string,
  args: string[],
  stdinInput: string
): Promise<{
  stdout: string;
  stderr: string;
  executionTime: number;
  success: boolean;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let settled = false;

    const child: ChildProcess = spawn(command, args, {
      timeout: TIMEOUT_MS,
    });

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      resolve({
        stdout,
        stderr,
        executionTime,
        success: exitCode === 0,
      });
    });

    child.on("error", (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      if (err.message.includes("ETIMEDOUT") || executionTime >= TIMEOUT_MS) {
        resolve({
          stdout,
          stderr: "Execution timed out (10 second limit exceeded)",
          executionTime,
          success: false,
        });
      } else {
        resolve({
          stdout,
          stderr: err.message,
          executionTime,
          success: false,
        });
      }
    });

    // Handle timeout manually since spawn timeout sends SIGTERM
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        settled = true;
        resolve({
          stdout,
          stderr: "Execution timed out (10 second limit exceeded)",
          executionTime: TIMEOUT_MS,
          success: false,
        });
      }
    }, TIMEOUT_MS);

    // Write stdin and close
    if (stdinInput) {
      child.stdin?.write(stdinInput);
    }
    child.stdin?.end();
  });
}
