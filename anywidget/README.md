# canvasxpress-anywidget

[CanvasXpress](https://canvasxpress.org) interactive charts as notebook widgets, built on
[anywidget](https://anywidget.dev). One package renders in **Jupyter, JupyterLab, Google
Colab, VS Code notebooks and marimo** — anywhere the anywidget protocol is supported.

The CanvasXpress library (CSS + JS) is loaded from the CanvasXpress CDN in the browser, so
there is no JavaScript build step and nothing to bundle.

## Install

```bash
pip install canvasxpress-anywidget
```

## Use

```python
from canvasxpress_anywidget import CanvasXpress

CanvasXpress(
    data={
        "y": {
            "vars": ["Revenue"],
            "smps": ["Q1", "Q2", "Q3", "Q4"],
            "data": [[10, 14, 9, 17]],
        }
    },
    config={"graphType": "Bar", "title": "Quarterly Revenue"},
)
```

`data`, `config` and `events` are exactly the arguments of `new CanvasXpress({...})` in
JavaScript, so any spec from the [gallery](https://canvasxpress.org/examples.html), the R /
Python packages, or the Quarto shortcode works unchanged.

### From a shared spec file

The `{"data", "config", "events"}` JSON object used across CanvasXpress hosts loads directly:

```python
import json
from canvasxpress_anywidget import CanvasXpress

spec = json.load(open("chart.json"))
CanvasXpress.from_spec(spec)
```

### Update in place

Assigning to an attribute re-renders the chart without creating a new cell output:

```python
w = CanvasXpress(data=..., config={"graphType": "Bar"})
w  # display it
w.config = {**w.config, "graphType": "Line"}   # morphs to a line chart
```

## Parameters

| Attribute | Type | Default | Meaning |
|-----------|------|---------|---------|
| `data`    | dict | `{}`    | CanvasXpress data object (`y`, `x`, `z`, …). |
| `config`  | dict | `{}`    | CanvasXpress configuration (`graphType`, `title`, …). |
| `events`  | dict | `{}`    | Optional event handlers. |
| `width`   | int  | `600`   | Canvas width in pixels. |
| `height`  | int  | `400`   | Canvas height in pixels. |

## License

This package is MIT-licensed. The CanvasXpress JavaScript library it loads is distributed separately under the CanvasXpress Community License (Attribution), free with a visible attribution mark and with commercial terms for mark removal — see https://www.canvasxpress.org/license.html.
<https://canvasxpress.org/license.html>.
