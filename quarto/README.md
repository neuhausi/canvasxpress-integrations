# CanvasXpress Quarto Extension

A [Quarto](https://quarto.org) shortcode extension that embeds interactive, reproducible
CanvasXpress charts in HTML documents from a JSON spec — no manual `<script>` wiring.

## Install

The extension is published from its own public repository (Quarto requires `_extensions/` at
the repo root, so it cannot be installed from this monorepo subdirectory):

```
quarto add neuhausi/canvasxpress-quarto            # latest
quarto add neuhausi/canvasxpress-quarto@v1.0.0     # pinned
```

Or copy `_extensions/canvasxpress/` into your project's `_extensions/` directory by hand.

## Use

In any `.qmd`:

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

## Requirements

Quarto ≥ 1.3, HTML output formats. The chart library is loaded from the CanvasXpress CDN at
render time, so no local JavaScript dependencies are needed.

## License

Dual-licensed. The core library is `LGPL-3.0-or-later`; commercial terms are available — see
<https://canvasxpress.org/license.html>.
