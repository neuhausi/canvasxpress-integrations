// CanvasXpress VS Code notebook renderer.
//
// VS Code calls `activate()` once per notebook webview; the returned
// `renderOutputItem` runs for each cell output whose mime type is
// `application/canvasxpress+json`. The output item is a `{data, config}` spec
// (optionally `events`, `width`, `height`) — the arguments to
// `new CanvasXpress({...})`. CanvasXpress is loaded once from the CDN. The
// renderer runs inside the notebook's webview (a browser), and the output
// element is already attached to the DOM, so we render straight into a canvas.

import type { ActivationFunction, OutputItem } from "vscode-notebook-renderer";

const CX_JS = "https://www.canvasxpress.org/dist/canvasXpress.min.js";
const CX_CSS = "https://www.canvasxpress.org/dist/canvasXpress.css";

let loading: Promise<any> | undefined;

// Load the CanvasXpress library once; resolve with the global constructor.
function loadCanvasXpress(): Promise<any> {
  const w = window as any;
  if (w.CanvasXpress) {
    return Promise.resolve(w.CanvasXpress);
  }
  if (loading) {
    return loading;
  }
  loading = new Promise<any>((resolve, reject) => {
    if (!document.querySelector("link[data-canvasxpress-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CX_CSS;
      link.setAttribute("data-canvasxpress-css", "1");
      document.head.appendChild(link);
    }
    const existing = document.querySelector(
      "script[data-canvasxpress]"
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).CanvasXpress));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = CX_JS;
    script.setAttribute("data-canvasxpress", "1");
    script.onload = () => resolve((window as any).CanvasXpress);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return loading;
}

let uid = 0;

// Render one CanvasXpress spec into `element`. Exported so the browser logic can
// be tested independently of the VS Code renderer API.
export function renderCanvasXpress(
  element: HTMLElement,
  spec: any,
  opts: { width?: number; height?: number } = {}
): void {
  const width = opts.width || (spec && spec.width) || 600;
  const height = opts.height || (spec && spec.height) || 400;

  element.innerHTML = "";
  const canvas = document.createElement("canvas");
  const id = "cx_vscode_" + Date.now() + "_" + uid++;
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  element.appendChild(canvas);

  loadCanvasXpress()
    .then((CanvasXpress) => {
      new CanvasXpress({
        renderTo: id,
        data: (spec && spec.data) || {},
        config: Object.assign({}, (spec && spec.config) || {}),
        events: (spec && spec.events) || {},
        width: width,
        height: height,
      });
    })
    .catch((e) => {
      element.innerHTML =
        '<div style="color:#b00020;font:13px system-ui">Failed to load CanvasXpress: ' +
        e +
        "</div>";
    });
}

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    const spec = outputItem.json();
    renderCanvasXpress(element, spec, {
      width: spec && spec.width,
      height: spec && spec.height,
    });
  },
});
