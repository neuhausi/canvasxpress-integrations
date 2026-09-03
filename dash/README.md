# canvasxpress-dash

[CanvasXpress](https://canvasxpress.org) interactive charts in [Dash](https://dash.plotly.com)
apps — no JavaScript build step. `CanvasXpress(...)` returns a self-contained `html.Iframe`
that loads the library from the CanvasXpress CDN and renders one chart.

## Install

```bash
pip install canvasxpress-dash
```

## Use

```python
from dash import Dash, html
from canvasxpress_dash import CanvasXpress

app = Dash(__name__)

app.layout = html.Div([
    html.H2("CanvasXpress in Dash"),
    CanvasXpress(
        data={
            "y": {
                "vars": ["Revenue"],
                "smps": ["Q1", "Q2", "Q3", "Q4"],
                "data": [[10, 14, 9, 17]],
            }
        },
        config={"graphType": "Bar", "title": "Quarterly Revenue"},
        height=420,
    ),
])

if __name__ == "__main__":
    app.run(debug=True)
```

`data` and `config` are exactly the arguments of `new CanvasXpress({...})` in JavaScript, so
any spec from the [gallery](https://canvasxpress.org/examples.html) or the R / Python packages
works unchanged.

## Parameters

| Argument | Type | Default | Meaning |
|----------|------|---------|---------|
| `data`   | dict | `{}`    | CanvasXpress data object. |
| `config` | dict | `{}`    | CanvasXpress configuration (`graphType`, `title`, …). |
| `width`  | int  | `600`   | Canvas width in pixels. |
| `height` | int  | `400`   | Canvas height in pixels. |
| `id`     | str  | auto    | Dash component id. |

Extra keyword arguments (`className`, `style`, …) pass through to the underlying `html.Iframe`.

## License

Dual-licensed. The core library is `LGPL-3.0-or-later`; commercial terms are available — see
<https://canvasxpress.org/license.html>.
