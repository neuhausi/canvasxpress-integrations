# CanvasXpress Notebook Renderer for VS Code

A [VS Code](https://code.visualstudio.com) notebook **output renderer** for
[CanvasXpress](https://canvasxpress.org). Call CanvasXpress the way you normally do in R,
Python or JavaScript and the chart is drawn, live and interactive, in the cell output. The
library is loaded from the CanvasXpress CDN inside the notebook webview.

There is no helper function to learn and no mime bundle to hand-write: the renderer reads the
output each package already produces and recovers the `{data, config}` spec from it.

## Use it natively

**R** — the ordinary `canvasXpress()` call. It returns an htmlwidget; the renderer reads the
widget payload.

```r
library(canvasXpress)

revenue <- data.frame(Q1 = 10, Q2 = 14, Q3 = 9, Q4 = 17, row.names = "Revenue")

canvasXpress(data = revenue, graphType = "Bar", title = "Quarterly Revenue")
```

**Python** — the ordinary `CanvasXpress` + `CXNoteBook` API.

```python
from canvasxpress.canvas import CanvasXpress
from canvasxpress.render.jupyter import CXNoteBook
from IPython.display import display

chart = CanvasXpress(
    render_to="bar1",
    data={"y": {"vars": ["Revenue"], "smps": ["Q1", "Q2", "Q3", "Q4"], "data": [[10, 14, 9, 17]]}},
    config={"graphType": "Bar", "title": "Quarterly Revenue"},
)

display(*CXNoteBook(chart).render())
```

> `CXNoteBook(...).render()` **returns** a list of display objects rather than displaying them,
> so on its own it prints `[<HTML object>, ...]` and nothing is drawn — in any Jupyter frontend,
> not just VS Code. Unpacking it into `display()` is what hands those objects to the notebook.

**JavaScript** — the ordinary `new CanvasXpress({...})` constructor, via the Deno or Node kernel.
A kernel has no DOM, so the shim in [`kernel-js/canvasxpress.mjs`](kernel-js/canvasxpress.mjs)
gives the object a Jupyter display representation instead of drawing it directly.

```js
import { CanvasXpress } from "../kernel-js/canvasxpress.mjs";

new CanvasXpress({
  renderTo: "bar1",
  data: { y: { vars: ["Revenue"], smps: ["Q1", "Q2", "Q3", "Q4"], data: [[10, 14, 9, 17]] } },
  config: { graphType: "Bar", title: "Quarterly Revenue" },
});
```

In Deno, leaving the chart as the cell's last expression is enough. In a Node kernel (`tslab`,
`ijavascript`) there is no last-expression hook — use that kernel's display helper with
`chart.toMimeBundle()`:

```js
$$.mime(chart.toMimeBundle());
```

`fromRows()` is also exported for the common tabular case, covering what a `data.frame` /
`DataFrame` does in the other two languages: row keys become `vars`, column keys become `smps`.

## Emitting the spec directly

Any cell that emits the mime type `application/canvasxpress+json` is also drawn. The payload is
a `{data, config}` object (optionally `events`, `afterRender`, `width`, `height`) — the
arguments to `new CanvasXpress({...})`. This is what the JavaScript shim produces, and it stays
available for kernels with no CanvasXpress package of their own.

```python
from IPython.display import display

display({"application/canvasxpress+json": {"data": ..., "config": ...}}, raw=True)
```

## Which outputs are claimed

| Mime type | Source | How the spec is found |
|---|---|---|
| `application/canvasxpress+json` | emitted directly; the JS shim | the payload *is* the spec |
| `text/html` | R `canvasXpress()` htmlwidget | the widget's JSON island (`data-for="htmlwidget-…"`) |
| `application/javascript` | Python `CXNoteBook(...).render()` | the inlined `new CanvasXpress({...})` argument |

Outputs with no CanvasXpress payload are passed through untouched — HTML is shown as HTML,
script is shown as source and never executed. Other htmlwidgets (plotly, leaflet) use the same
JSON-island carrier and are deliberately not claimed.

VS Code's built-in renderer also handles `text/html` and `application/javascript`. If a cell
shows raw markup instead of a chart, click the **···** on the output and choose
**Change Presentation → CanvasXpress**.

## Examples

Three ready-to-run notebooks live in [`examples/`](examples). Open one in VS Code with this
extension installed and run the cells:

- [`canvasxpress-demo.ipynb`](examples/canvasxpress-demo.ipynb) — Python (Jupyter kernel)
- [`canvasxpress-demo-R.ipynb`](examples/canvasxpress-demo-R.ipynb) — R (IRkernel)
- [`canvasxpress-demo-JS.ipynb`](examples/canvasxpress-demo-JS.ipynb) — JavaScript (Deno kernel)

Each covers a bar chart, a scatter plot and a heatmap, then a fourth case specific to the
language — sample annotation in R, a `DataFrame` and multi-chart output in Python, explicit
display in JavaScript.

Kernel setup, if you do not already have them:

```bash
pip install canvasxpress pandas          # Python
deno jupyter --install                    # JavaScript
```
```r
install.packages(c("canvasXpress", "IRkernel")); IRkernel::installspec()   # R
```

## Build

```bash
npm install
npm run build          # bundles src/renderer.ts -> out/renderer.js via esbuild
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host, or package with
[`vsce`](https://github.com/microsoft/vscode-vsce):

```bash
npx @vscode/vsce package
```

## How it works

`src/renderer.ts` exports the VS Code `activate()` renderer. Its `renderOutputItem` resolves the
output to one or more CanvasXpress specs, creates a `<canvas>` per spec in the (already-attached)
output element, loads CanvasXpress once from the CDN, and calls `new CanvasXpress({...})`.

`src/extract.ts` holds the recovery logic for the `text/html` and `application/javascript`
carriers. Both payloads are machine-generated JSON, so a string-aware brace scan plus
`JSON.parse` is enough — no HTML parser is bundled, and nothing from the output is executed.

The chart-drawing logic is factored into the exported `renderCanvasXpress(element, spec, opts)`
and `renderCanvasXpressAll(element, specs)` so it can be reused and tested outside the VS Code
renderer API.

## License

This extension and the CanvasXpress JavaScript library it renders are covered by the
**CanvasXpress Community License (Attribution)** (`LicenseRef-CanvasXpress-Community-Attribution`;
see [`LICENSE`](LICENSE)). CanvasXpress is free to use anywhere — including in commercial products —
as long as the attribution mark it renders stays visible; a Commercial License (license key) removes
the mark. Terms and pricing: <https://canvasxpress.org/license.html>.
