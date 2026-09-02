# CanvasXpress Quarto Extension (roadmap #08)

A [Quarto](https://quarto.org) shortcode extension that embeds interactive, reproducible
CanvasXpress charts in HTML documents from a JSON spec — no manual `<script>` wiring.

## Use

Copy `_extensions/canvasxpress/` into your project's `_extensions/` directory (or
`quarto add <path-or-repo>`), then in any `.qmd`:

```markdown
{{< canvasxpress spec.json >}}
{{< canvasxpress spec="spec.json" width="800" height="300" >}}
```

`spec.json` is a JSON object with `data` and `config` keys — the arguments to
`new CanvasXpress({...})`. See `example-spec.json` and `example.qmd`.

The extension injects the CanvasXpress library (CSS + JS) into the document head once, from the
CDN, and emits a `<canvas>` + constructor per shortcode. HTML formats only.

## Verify

```
quarto render example.qmd --to html
```

Produces `example.html` with the CanvasXpress library in `<head>` and one live instance per
shortcode (hover, zoom, toolbar all work).

## Status

Verified working with Quarto ≥1.3. This is one of the roadmap #08 "meet people inside their
tools" integrations. Companion integrations still to build: an **anywidget** JupyterLab widget
(over the existing PyPI package, replacing HTML injection), Streamlit/Dash components, a
**Bioconductor** submission alongside CRAN, an Observable standard-library entry, a VS Code
notebook renderer, and a `%%cxplot` IPython magic.
