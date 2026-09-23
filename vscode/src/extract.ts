// Recover CanvasXpress specs from `text/html` notebook output.
//
// The R and Python packages already compute exactly the object that
// `new CanvasXpress({...})` wants — they just ship it wrapped in an HTML blob
// aimed at a browser. Recovering it here is what lets users call each library
// the native way (`canvasXpress(df, ...)`, `CXNoteBook(cx).render()`) and still
// get a live chart in a VS Code notebook, instead of hand-emitting the
// `application/canvasxpress+json` mime type.
//
// Two carriers are supported:
//
//   R (htmlwidgets)  <div id="htmlwidget-<id>" class="canvasXpress html-widget">
//                    <script type="application/json" data-for="htmlwidget-<id>">
//                      {"x":{"data":..,"config":..},"evals":[],"jsHooks":{}}
//
//   Python           <canvas id="<id>" width=500 height=500>
//                    ... var chart_<id> = new CanvasXpress({ ...json... });
//
// Both payloads are machine-generated JSON, so a string-aware brace scan plus
// JSON.parse is sufficient — no HTML parser is pulled in.

export interface CxSpec {
  data?: any;
  config?: any;
  events?: any;
  afterRender?: any;
  renderTo?: string;
  width?: number;
  height?: number;
}

// Index of the `}` closing the `{` at `start`, or -1. String-aware so braces
// inside quoted values (e.g. a title of "a{b") do not throw the depth off.
function matchBrace(src: string, start: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < src.length; i++) {
    const ch = src.charAt(i);
    if (quote) {
      if (ch === "\\") {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPx(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const n = parseInt(value, 10);
  return isFinite(n) && n > 0 ? n : undefined;
}

// Width/height of the element the chart renders into. The R widget carries it
// as an inline style on the container div; Python as attributes on the canvas.
function sizeForTarget(html: string, id: string): { width?: number; height?: number } {
  const tag = new RegExp(
    '<(?:div|canvas)[^>]*\\bid=["\']?' + escapeRe(id) + '["\'\\s>][^>]*>',
    "i"
  );
  const m = tag.exec(html);
  if (!m) {
    return {};
  }
  const el = m[0];
  const style = /style=["']([^"']*)["']/i.exec(el);
  if (style) {
    return {
      width: toPx((/width:\s*([0-9]+)/i.exec(style[1]) || [])[1]),
      height: toPx((/height:\s*([0-9]+)/i.exec(style[1]) || [])[1]),
    };
  }
  return {
    width: toPx((/\bwidth=["']?([0-9]+)/i.exec(el) || [])[1]),
    height: toPx((/\bheight=["']?([0-9]+)/i.exec(el) || [])[1]),
  };
}

// R / htmlwidgets: the payload rides in a JSON island keyed to the container id.
export function extractHtmlWidgetSpecs(html: string): CxSpec[] {
  const specs: CxSpec[] = [];
  const script = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = script.exec(html))) {
    const attrs = m[1];
    if (!/type=["']application\/json["']/i.test(attrs)) {
      continue;
    }
    const forAttr = /data-for=["']([^"']+)["']/i.exec(attrs);
    if (!forAttr) {
      continue;
    }
    const id = forAttr[1];
    let payload: any;
    try {
      payload = JSON.parse(m[2]);
    } catch (e) {
      continue;
    }
    const x = payload && payload.x;
    if (!x || typeof x !== "object" || !x.data || !x.config) {
      continue;
    }
    // Only claim widgets that are actually CanvasXpress — other htmlwidgets
    // (plotly, leaflet, ...) use the same JSON-island carrier.
    const container = new RegExp(
      '<div[^>]*\\bid=["\']' + escapeRe(id) + '["\'][^>]*>',
      "i"
    ).exec(html);
    if (container && !/class=["'][^"']*canvasXpress/i.test(container[0])) {
      continue;
    }
    const size = sizeForTarget(html, id);
    specs.push({
      data: x.data,
      config: x.config,
      events: x.events,
      afterRender: x.afterRender,
      renderTo: id,
      width: size.width,
      height: size.height,
    });
  }
  return specs;
}

// Python: the spec is the literal argument to an inlined `new CanvasXpress(...)`.
export function extractInlineConstructorSpecs(html: string): CxSpec[] {
  const specs: CxSpec[] = [];
  const call = /new\s+CanvasXpress\s*\(\s*(?=\{)/g;
  let m: RegExpExecArray | null;
  while ((m = call.exec(html))) {
    const open = html.indexOf("{", m.index);
    if (open < 0) {
      break;
    }
    const close = matchBrace(html, open);
    if (close < 0) {
      break;
    }
    call.lastIndex = close;
    let spec: any;
    try {
      spec = JSON.parse(html.slice(open, close + 1));
    } catch (e) {
      // Not a plain JSON argument (hand-written JS, variables, comments) —
      // skip rather than risk mis-rendering.
      continue;
    }
    if (!spec || typeof spec !== "object" || (!spec.data && !spec.config)) {
      continue;
    }
    const size = spec.renderTo ? sizeForTarget(html, spec.renderTo) : {};
    specs.push({
      data: spec.data,
      config: spec.config,
      events: spec.events,
      afterRender: spec.afterRender,
      renderTo: spec.renderTo,
      width: spec.width || size.width,
      height: spec.height || size.height,
    });
  }
  return specs;
}

// True when an HTML output is only CanvasXpress scaffolding: the placeholder
// canvas (or license tag) the Python package emits as its own output, with the
// chart itself arriving separately as `application/javascript`. Rendering that
// markup verbatim would paint an empty canvas the size of the chart, leaving a
// large blank gap above the real one, so the caller draws nothing instead.
//
// Deliberately narrow: an output that carries any visible text, or no canvas at
// all, is not scaffolding and must still be shown.
export function isBareCanvasScaffolding(html: string): boolean {
  if (!html || !html.trim()) {
    return true;
  }
  if (!/<canvas[\s>]/i.test(html)) {
    return false;
  }
  var text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length === 0;
}

// Every CanvasXpress spec carried by an HTML output, in document order.
// Returns [] for HTML that has nothing to do with CanvasXpress, which is the
// caller's signal to leave the output alone.
export function extractCanvasXpressSpecs(html: string): CxSpec[] {
  if (!html || html.indexOf("CanvasXpress") < 0 && html.indexOf("canvasXpress") < 0) {
    return [];
  }
  const specs = extractHtmlWidgetSpecs(html).concat(
    extractInlineConstructorSpecs(html)
  );
  // A single output should never carry both carriers for one chart, but guard
  // against a double render if it ever does.
  const seen: { [id: string]: boolean } = {};
  return specs.filter(function (s) {
    if (!s.renderTo) {
      return true;
    }
    if (seen[s.renderTo]) {
      return false;
    }
    seen[s.renderTo] = true;
    return true;
  });
}
