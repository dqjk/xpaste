import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";

const applicationPath = fileURLToPath(new URL("../dist/server/app.js", import.meta.url));

function withDeadline(promise, label, milliseconds = 8_000) {
  const signal = AbortSignal.timeout(milliseconds);
  const timeout = new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error(`${label} timed out`)), { once: true });
  });
  return Promise.race([promise, timeout]);
}

async function allocatePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address, "object");
  assert.notEqual(address, null);
  const port = address.port;
  server.close();
  await once(server, "close");
  return port;
}

async function startApplication(port) {
  const childProcess = spawn(process.execPath, [applicationPath, "--port", String(port)], {
    cwd: tmpdir(),
    stdio: ["ignore", "pipe", "pipe"]
  });
  childProcess.stdout.setEncoding("utf8");
  childProcess.stderr.setEncoding("utf8");

  let output = "";
  let errors = "";
  childProcess.stdout.on("data", (chunk) => {
    output += chunk;
  });
  childProcess.stderr.on("data", (chunk) => {
    errors += chunk;
  });

  await withDeadline(
    new Promise((resolve, reject) => {
      const inspectOutput = () => {
        if (output.includes("xpaste is ready")) {
          resolve();
        }
      };
      childProcess.stdout.on("data", inspectOutput);
      childProcess.once("error", reject);
      childProcess.once("exit", (code) => reject(new Error(`server exited early (${code}): ${errors}`)));
    }),
    "server startup"
  );

  return { process: childProcess, getErrors: () => errors };
}

async function stopApplication(application) {
  if (application.process.exitCode !== null) {
    return;
  }

  application.process.kill("SIGTERM");
  await withDeadline(once(application.process, "exit"), "server shutdown");
  assert.equal(application.getErrors(), "");
}

class EventStream {
  #buffer = "";
  #controller;
  #decoder = new TextDecoder();
  #events = [];
  #reader;

  constructor(response, controller) {
    assert.ok(response.body);
    this.#reader = response.body.getReader();
    this.#controller = controller;
  }

  async nextOfType(expectedType) {
    while (true) {
      const event = await withDeadline(this.#nextEvent(), `SSE event ${expectedType}`);
      if (event.type === expectedType) {
        return event;
      }
    }
  }

  async close() {
    await this.#reader.cancel();
    this.#controller.abort();
  }

  async #nextEvent() {
    while (this.#events.length === 0) {
      const { done, value } = await this.#reader.read();
      if (done) {
        throw new Error("SSE stream closed before the expected event");
      }

      this.#buffer += this.#decoder.decode(value, { stream: true });
      const frames = this.#buffer.split("\n\n");
      this.#buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
        if (dataLine) {
          this.#events.push(JSON.parse(dataLine.slice(5).trim()));
        }
      }
    }

    return this.#events.shift();
  }
}

async function connectEventStream(baseUrl, deviceId, userAgent) {
  const controller = new AbortController();
  const response = await fetch(`${baseUrl}/events`, {
    headers: {
      Cookie: `deviceId=${deviceId}`,
      "User-Agent": userAgent
    },
    signal: controller.signal
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/event-stream/);
  return new EventStream(response, controller);
}

async function postText(baseUrl, deviceId, text) {
  return fetch(`${baseUrl}/data`, {
    method: "POST",
    headers: {
      Cookie: `deviceId=${deviceId}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
}

async function postBinary(baseUrl, deviceId, name, type, content) {
  const formData = new FormData();
  formData.set("file", new File([content], name, { type }));
  return fetch(`${baseUrl}/data`, {
    method: "POST",
    headers: { Cookie: `deviceId=${deviceId}` },
    body: formData
  });
}

test("CLI metadata and validation remain lightweight", () => {
  const help = spawnSync(process.execPath, [applicationPath, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: xpaste \[options\]/);
  assert.match(help.stdout, /--port <port>/);

  const version = spawnSync(process.execPath, [applicationPath, "--version"], { encoding: "utf8" });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "0.1.0");

  const invalid = spawnSync(process.execPath, [applicationPath, "--port", "70000"], { encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /between 1 and 65535/);
});

test("server supports static assets, SSE lifecycle, all data kinds, eviction, and cleanup", async () => {
  const port = await allocatePort();
  const application = await startApplication(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  let alpha;
  let beta;

  try {
    const [indexResponse, styleResponse, clientResponse, sharedResponse] = await Promise.all([
      fetch(`${baseUrl}/`),
      fetch(`${baseUrl}/style.css`),
      fetch(`${baseUrl}/client/index.js`),
      fetch(`${baseUrl}/shared/index.js`)
    ]);
    assert.equal(indexResponse.status, 200);
    assert.match(await indexResponse.text(), /data-role="app"/);
    assert.equal(styleResponse.status, 200);
    assert.equal(clientResponse.status, 200);
    assert.equal(sharedResponse.status, 200);

    const missingCookie = await fetch(`${baseUrl}/events`);
    assert.equal(missingCookie.status, 400);

    alpha = await connectEventStream(baseUrl, "alpha", "Mozilla/5.0 (Windows NT 10.0) Chrome/126");
    const alphaList = await alpha.nextOfType("device-list");
    assert.equal(alphaList.devices.length, 1);
    assert.equal(alphaList.devices[0].deviceId, "alpha");
    const alphaConnected = await alpha.nextOfType("device-connected");
    assert.equal(alphaConnected.device.deviceId, "alpha");

    beta = await connectEventStream(baseUrl, "beta", "Mozilla/5.0 (iPhone) Safari/605.1");
    const betaList = await beta.nextOfType("device-list");
    assert.deepEqual(
      betaList.devices.map((device) => device.deviceId).sort(),
      ["alpha", "beta"]
    );
    const betaConnected = await alpha.nextOfType("device-connected");
    assert.equal(betaConnected.device.deviceId, "beta");

    const unknownDevice = await postText(baseUrl, "missing", "not accepted");
    assert.equal(unknownDevice.status, 404);

    const oversizedText = await postText(baseUrl, "alpha", "x".repeat(256 * 1024 + 1));
    assert.equal(oversizedText.status, 413);

    const textResponse = await postText(baseUrl, "alpha", "shared text");
    assert.equal(textResponse.status, 201);
    const textBody = await textResponse.json();
    assert.equal(textBody.data.kind, "text");
    assert.equal(textBody.data.inline, true);
    const textCreated = await beta.nextOfType("data-created");
    assert.equal(textCreated.data.dataId, textBody.data.dataId);
    const textResource = await fetch(`${baseUrl}/data/alpha/${textBody.data.dataId}`);
    assert.equal(await textResource.text(), "shared text");

    const binaryCases = [
      { name: "photo.png", type: "image/png", content: "image-content", kind: "image" },
      { name: "clip.mp4", type: "video/mp4", content: "video-content", kind: "video" },
      { name: "notes.txt", type: "text/plain", content: "file-content", kind: "file" }
    ];
    for (const binaryCase of binaryCases) {
      const response = await postBinary(
        baseUrl,
        "alpha",
        binaryCase.name,
        binaryCase.type,
        binaryCase.content
      );
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.data.kind, binaryCase.kind);
      const resource = await fetch(`${baseUrl}/data/alpha/${body.data.dataId}`);
      assert.equal(resource.status, 200);
      assert.equal(await resource.text(), binaryCase.content);
    }

    const oversizedFile = await postBinary(
      baseUrl,
      "alpha",
      "oversized.bin",
      "application/octet-stream",
      new Uint8Array(20 * 1024 * 1024 + 1)
    );
    assert.equal(oversizedFile.status, 413);

    let latestDataId = "";
    for (let index = 0; index < 6; index += 1) {
      const response = await postText(baseUrl, "alpha", `rolling-${index}`);
      assert.equal(response.status, 201);
      const body = await response.json();
      latestDataId = body.data.dataId;
    }
    assert.equal((await fetch(`${baseUrl}/data/alpha/${textBody.data.dataId}`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/data/alpha/${latestDataId}`)).status, 200);

    await alpha.close();
    alpha = undefined;
    const offline = await beta.nextOfType("device-offline");
    assert.equal(offline.deviceId, "alpha");
    assert.equal((await fetch(`${baseUrl}/data/alpha/${latestDataId}`)).status, 404);
  } finally {
    await alpha?.close();
    await beta?.close();
    await stopApplication(application);
  }
});
