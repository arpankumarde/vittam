import { mountWidget, unmountWidget, sendMessageToWidget } from "./widget/mounter";

// Auto-mount (when script tag loads)
(function autoMount() {
  try {
    const currentScript = document.currentScript as HTMLScriptElement | null;
    let scriptEl = currentScript;
    if (!scriptEl) {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; --i) {
        if (scripts[i].src && scripts[i].src.includes("chat-widget.iife.js")) {
          scriptEl = scripts[i] as HTMLScriptElement;
          break;
        }
      }
    }

    const botId = scriptEl?.getAttribute("data-bot-id") || "local";
    const position = (scriptEl?.getAttribute("data-position") as any) || "bottom-right";
    const width = Number(scriptEl?.getAttribute("data-width") || 360);
    const height = Number(scriptEl?.getAttribute("data-height") || 520);

    mountWidget({ botId, position, width, height });
  } catch (e) {
    console.error("chat widget auto-mount error:", e);
  }
})();

// Expose global API
// @ts-ignore
(window).ChatWidget = {
  mount: mountWidget,
  unmount: unmountWidget,
  sendMessage: (m: string) => sendMessageToWidget(m)
};
