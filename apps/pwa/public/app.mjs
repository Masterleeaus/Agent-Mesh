const modes = new Set(["zero", "go", "hub"]);
const titles = { zero: "Zero is ready to connect", go: "Go is ready to connect", hub: "Hub is ready to connect" };
const buttons = [...document.querySelectorAll("[data-mode]")];
const network = document.querySelector("#network");

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
  const online = navigator.onLine;
  network.textContent = online ? "Online · service not configured" : "Offline · shell only";
  network.dataset.online = String(online);
}
selectMode(currentMode(), false);
updateNetwork();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
  network.textContent = "Install support unavailable";
});
