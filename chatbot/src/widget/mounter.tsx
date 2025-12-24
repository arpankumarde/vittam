import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import App from "./App";

export type Config = {
  botId?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  width?: number;
  height?: number;
  initialRoute?: string; // optional: start route inside MemoryRouter
};

let root: Root | null = null;
let hostEl: HTMLElement | null = null;

/**
 * Mount the widget into the host page by creating a host element,
 * attaching a shadowRoot and rendering React into it.
 */
export function mountWidget(config: Config = {}) {
  if (hostEl) return; // already mounted

  const {
    botId = "local",
    position = "bottom-right",
    width = 360,
    height = 520,
    initialRoute = "/",
  } = config;

  hostEl = document.createElement("div");
  hostEl.id = `chat-widget-host-${botId}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  // base host styles
  hostEl.style.position = "fixed";
  hostEl.style.zIndex = "2147483647";
  // position bottom-right by default; you can adjust if you support other positions
  // hostEl.style.right = "20px";
  // hostEl.style.bottom = "20px";
  // hostEl.style.width = `${width}px`;
  // hostEl.style.height = `${height}px`;
  // hostEl.style.pointerEvents = "auto";
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    hostEl.style.inset = "0";
    hostEl.style.width = "100dvw";
    hostEl.style.height = "100dvh";
    hostEl.style.borderRadius = "0";
  } else {
    hostEl.style.width = `${width}px`; // 360px
    hostEl.style.height = `${height}px`; // 520px
    hostEl.style.right = "1.25rem";
    hostEl.style.bottom = "1.25rem";
  }

  document.body.appendChild(hostEl);

  // create shadow root for isolation (fallback to hostEl itself if no shadow support)
  const shadow = hostEl.attachShadow
    ? hostEl.attachShadow({ mode: "open" })
    : hostEl;

  // Inject Tailwind CDN (or your CSS). For production you should bundle CSS.
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
  shadow.appendChild(link);

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap";
  shadow.appendChild(fontLink);

  // Small reset/style to ensure consistent rendering inside shadow root
  const style = document.createElement("style");
  style.textContent = `
:host {
  all: initial;
  display: block;
  width: 100%;
  height: 100%;
  font-family:
    "Geist",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  /* Vittam Brand Theme */
  --v-bg: #fcf7ed;
  --v-card: #f7f1e6;
  --v-border: #e6ded2;
  --v-text: #1f1b13;
  --v-muted: #6b665e;
  --v-primary: #009688;
  --v-primary-soft: #cfe9e4;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: var(--v-text);
}
`;
  shadow.appendChild(style);

  // Create mount point inside the shadow root
  const mountPoint = document.createElement("div");
  mountPoint.id = "chat-widget-mount";
  mountPoint.style.width = "100%";
  mountPoint.style.height = "100%";
  mountPoint.style.display = "flex";
  shadow.appendChild(mountPoint);

  // Create React root and render wrapped with MemoryRouter
  root = createRoot(mountPoint);
  root.render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App botId={botId} />
    </MemoryRouter>
  );

  // Persist references for API functions
  (hostEl as any).__chatWidget = { root, config, hostEl, shadow };

  return { hostEl, shadow };
}

/**
 * Unmount the React root and remove the host element.
 */
export function unmountWidget() {
  if (!hostEl) return;
  if (root) {
    root.unmount();
    root = null;
  }
  try {
    hostEl.remove();
  } catch (e) {
    // ignore
  }
  hostEl = null;
}

/**
 * Send a message into the mounted widget from the host page.
 * This dispatches a CustomEvent into the widget's shadowRoot (or hostEl)
 * called "chatwidget:send" with { message } as detail.
 */
export function sendMessageToWidget(message: string) {
  if (!hostEl) return;
  const target = (hostEl.shadowRoot || hostEl) as any;
  const evt = new CustomEvent("chatwidget:send", { detail: { message } });
  target.dispatchEvent(evt);
}
