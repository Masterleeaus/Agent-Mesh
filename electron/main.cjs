const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const HOST = "127.0.0.1";
const PORT = Number(process.env.TITAN_ZERO_PORT || 39177);
let serverProcess = null;
let mainWindow = null;

function candidateServers() {
  const resources = process.resourcesPath;
  return [
    path.join(resources, "app", "apps", "web", "server.js"),
    path.join(resources, "app", "server.js"),
    path.join(app.getAppPath(), "apps", "web", ".next", "standalone", "apps", "web", "server.js"),
    path.join(app.getAppPath(), "apps", "web", ".next", "standalone", "server.js"),
  ];
}

function resolveServer() {
  const found = candidateServers().find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error("Titan Zero standalone Next.js server.js was not found in packaged resources.");
  }
  return found;
}

function waitForServer(timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get({ host: HOST, port: PORT, path: "/", timeout: 1500 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started >= timeoutMs) {
          reject(new Error(`Titan Zero local server did not become ready on ${HOST}:${PORT}.`));
        } else {
          setTimeout(probe, 250);
        }
      });
      req.on("timeout", () => req.destroy());
    };
    probe();
  });
}

function startServer() {
  const serverPath = resolveServer();
  const cwd = path.dirname(serverPath);
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME: HOST,
      PORT: String(PORT),
      APP_URL: `http://${HOST}:${PORT}`,
      NEXT_PUBLIC_APP_URL: `http://${HOST}:${PORT}`,
    },
  });

  serverProcess.stdout?.on("data", (data) => console.log(`[Titan Zero] ${data}`));
  serverProcess.stderr?.on("data", (data) => console.error(`[Titan Zero] ${data}`));
  serverProcess.on("exit", (code) => {
    if (!app.isQuitting && code !== 0) {
      console.error(`Titan Zero local server exited with code ${code}`);
    }
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    try { serverProcess.kill(); } catch {}
  }
  serverProcess = null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#111111",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: process.env.TITAN_ZERO_DEVTOOLS === "1",
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  await mainWindow.loadURL(`http://${HOST}:${PORT}`);
}

app.on("before-quit", () => {
  app.isQuitting = true;
  stopServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(async () => {
  try {
    startServer();
    await waitForServer();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox("Titan Zero startup failed", String(error?.stack || error));
    stopServer();
    app.quit();
  }
});
