# CanvasXpress Notebook Renderer for VS Code

A [VS Code](https://code.visualstudio.com) notebook **output renderer** for
[CanvasXpress](https://canvasxpress.org). Any notebook cell that emits the mime type
`application/canvasxpress+json` is drawn as an interactive CanvasXpress chart in the cell
output. The library is loaded from the CanvasXpress CDN inside the notebook webview.

## Emitting the mime type

The output payload is a `{data, config}` object (optionally `events`, `width`, `height`) — the
arguments to `new CanvasXpress({...})`.

**Python (Jupyter kernel):**

```python
from IPython.display import display

spec = {
    "data": {"y": {"vars": ["Revenue"],
                   "smps": ["Q1", "Q2", "Q3", "Q4"],
                   "data": [[10, 14, 9, 17]]}},
    "config": {"graphType": "Bar", "title": "Quarterly Revenue"},
}
display({"application/canvasxpress+json": spec}, raw=True)
```

**R (IRkernel):** serialize the spec to a JSON string (so scalars stay scalars) and publish it.

```r
library(jsonlite)
spec <- list(
  data   = list(y = list(vars = list("Revenue"),
                         smps = list("Q1", "Q2", "Q3", "Q4"),
                         data = list(c(10, 14, 9, 17)))),
  config = list(graphType = "Bar", title = "Quarterly Revenue", xAxis = list("Revenue"))
)
IRdisplay::publish_mimebundle(
  list("application/canvasxpress+json" = toJSON(spec, auto_unbox = TRUE))
)
```

> R note: this is **not** `canvasXpress()` from the R package — that returns an htmlwidget
> (`text/html`), which this renderer does not handle. Emit the raw `{data, config}` spec instead.

## Examples

Two ready-to-run notebooks live in [`examples/`](examples). Open either in VS Code with this
extension installed and run the cells to see the interactive charts:

- [`canvasxpress-demo.ipynb`](examples/canvasxpress-demo.ipynb) — Python (Jupyter kernel)
- [`canvasxpress-demo-R.ipynb`](examples/canvasxpress-demo-R.ipynb) — R (IRkernel)

Each covers Bar, Scatter, and Heatmap, plus a final cell that renders straight from a
`DataFrame` / `data.frame` (index/row-names → `vars`, columns → `smps`) — the common case
where your data is already tabular rather than a hand-written `y` object.

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

`src/renderer.ts` exports the VS Code `activate()` renderer. Its `renderOutputItem` reads the
`{data, config}` spec, creates a `<canvas>` in the (already-attached) output element, loads
CanvasXpress once from the CDN, and calls `new CanvasXpress({...})`. The chart-drawing logic is
factored into the exported `renderCanvasXpress(element, spec, opts)` so it can be reused and
tested outside the VS Code renderer API.

## License

This extension and the CanvasXpress JavaScript library it renders are covered by the
**CanvasXpress Community License (Attribution)** (`LicenseRef-CanvasXpress-Community-Attribution`;
see [`LICENSE`](LICENSE)). CanvasXpress is free to use anywhere — including in commercial products —
as long as the attribution mark it renders stays visible; a Commercial License (license key) removes
the mark. Terms and pricing: <https://canvasxpress.org/license.html>.
