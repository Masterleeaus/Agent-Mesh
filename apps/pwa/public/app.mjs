const modes = new Set(["zero", "go", "hub"]);
const titles = {
  zero: "Zero · Workforce not configured",
  go: "Go · Workforce not configured",
  hub: "Hub · Workforce not configured",
};
const buttons = [...document.querySelectorAll("[data-mode]")];
const network = document.querySelector("#network");
const connectionCopy = document.querySelector("#connection-copy");
const installationStatus = document.querySelector("#installation-status");

function currentMode() {
  const requested = new URL(location.href).searchParams.get("mode");
  return modes.has(requested) ? requested : "zero";
}
function selectMode(mode, updateUrl = true) {
  if (!modes.has(mode)) return;
  for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  document.querySelector("#mode-title").textContent = titles[mode];
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("mode", mode);
    history.pushState({ mode }, "", url);
  }
}
for (const button of buttons) button.addEventListener("click", () => selectMode(button.dataset.mode));
addEventListener("popstate", () => selectMode(currentMode(), false));
addEventListener("online", () => updateNetwork());
addEventListener("offline", () => updateNetwork());
function updateNetwork() {
  const browserOnline = navigator.onLine === true;
  network.textContent = browserOnline ? "Network available" : "Browser offline · shell only";
  network.dataset.online = String(browserOnline);
  network.dataset.hostedService = "unconfigured";
  connectionCopy.textContent = browserOnline
    ? "Your browser reports network availability, but this shell has no authenticated Workforce connection. Company data and actions remain unavailable."
    : "Your browser is offline. Only the public shell is available; Workforce, company data, and actions remain unavailable.";
}
selectMode(currentMode(), false);
updateNetwork();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      installationStatus.textContent = "The public shell is ready for offline launch.";
      installationStatus.hidden = false;
    })
    .catch(() => {
      installationStatus.textContent = "Offline shell support is unavailable in this browser.";
      installationStatus.hidden = false;
    });
} else {
  installationStatus.textContent = "Offline shell support is unavailable in this browser.";
  installationStatus.hidden = false;
}
