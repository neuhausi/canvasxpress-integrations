// CanvasXpress VS Code notebook renderer.
//
// VS Code calls `activate()` once per notebook webview; the returned
// `renderOutputItem` runs for each cell output this renderer claims. Two mime
// types are handled:
//
//   application/canvasxpress+json  an explicit `{data, config}` spec
//   text/html                      output from the native R / Python packages,
//                                  from which the spec is recovered (extract.ts)
//
// The `text/html` path is what lets users keep calling each library the native
// way — `canvasXpress(df, ...)` in R, `CXNoteBook(cx).render()` in Python —
// rather than hand-emitting a mime bundle. HTML with no CanvasXpress payload is
// passed through untouched so this renderer never eats unrelated output.
//
// CanvasXpress is loaded once from the CDN. The renderer runs inside the
// notebook's webview (a browser) and the output element is already attached to
// the DOM, so we render straight into a canvas.

import type { ActivationFunction, OutputItem } from "vscode-notebook-renderer";
import {
  extractCanvasXpressSpecs,
  isBareCanvasScaffolding,
  CxSpec,
} from "./extract";

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

function showError(element: HTMLElement, message: string): void {
  const div = document.createElement("div");
  div.style.cssText = "color:#b00020;font:13px system-ui";
  div.textContent = message;
  element.appendChild(div);
}

// Draw one spec into `container`, which is assumed empty. Does not clear the
// caller's element, so several specs can share one output.
function drawSpec(container: HTMLElement, spec: CxSpec): void {
  const width = spec.width || 600;
  const height = spec.height || 400;

  const canvas = document.createElement("canvas");
  // The id the chart renders into must be unique per webview: the same cell can
  // be re-run and the R/Python payloads carry ids that repeat across cells.
  const id = "cx_vscode_" + Date.now() + "_" + uid++;
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  loadCanvasXpress()
    .then((CanvasXpress) => {
      const args: any = {
        renderTo: id,
        data: spec.data || {},
        config: Object.assign({}, spec.config || {}),
        width: width,
        height: height,
      };
      // Only forward these when present — CanvasXpress treats an explicit null
      // differently from an absent key, and the R payload sets them to null.
      if (spec.events) {
        args.events = spec.events;
      }
      if (spec.afterRender) {
        args.afterRender = spec.afterRender;
      }
      new CanvasXpress(args);
    })
    .catch((e) => {
      showError(container, "Failed to load CanvasXpress: " + e);
    });
}

// Render one CanvasXpress spec into `element`. Exported so the browser logic can
// be tested independently of the VS Code renderer API.
export function renderCanvasXpress(
  element: HTMLElement,
  spec: any,
  opts: { width?: number; height?: number } = {}
): void {
  element.innerHTML = "";
  drawSpec(element, {
    data: spec && spec.data,
    config: spec && spec.config,
    events: spec && spec.events,
    afterRender: spec && spec.afterRender,
    width: opts.width || (spec && spec.width),
    height: opts.height || (spec && spec.height),
  });
}

// Render every spec carried by an HTML output. Charts are stacked vertically;
// the source HTML may have laid them out in a grid, but that layout lives in
// markup we deliberately do not execute.
export function renderCanvasXpressAll(element: HTMLElement, specs: CxSpec[]): void {
  element.innerHTML = "";
  for (let i = 0; i < specs.length; i++) {
    const container = document.createElement("div");
    if (i > 0) {
      container.style.marginTop = "12px";
    }
    element.appendChild(container);
    drawSpec(container, specs[i]);
  }
}

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    // `text/html` carries the R widget; `application/javascript` carries the
    // Python package's chart (its canvas markup arrives as a separate output,
    // which has no spec in it and so renders as nothing).
    if (
      outputItem.mime === "text/html" ||
      outputItem.mime === "application/javascript"
    ) {
      const source = outputItem.text();
      const specs = extractCanvasXpressSpecs(source);
      if (specs.length) {
        renderCanvasXpressAll(element, specs);
        return;
      }
      element.innerHTML = "";
      if (outputItem.mime === "text/html") {
        // The Python package emits its placeholder canvas as an output of its
        // own and the chart as a separate script output. Showing the
        // placeholder would paint an empty canvas the full size of the chart,
        // leaving a large blank gap above the real one.
        if (isBareCanvasScaffolding(source)) {
          return;
        }
        // Nothing CanvasXpress here. Show the output rather than swallowing it.
        element.innerHTML = source;
      } else {
        const pre = document.createElement("pre");
        pre.style.cssText = "white-space:pre-wrap;font:12px ui-monospace,monospace";
        pre.textContent = source;
        element.appendChild(pre);
      }
      return;
    }
    const spec = outputItem.json();
    renderCanvasXpress(element, spec, {
      width: spec && spec.width,
      height: spec && spec.height,
    });
  },
});
