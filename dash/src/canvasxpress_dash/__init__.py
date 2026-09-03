"""CanvasXpress charts in Dash apps.

A no-build helper: `CanvasXpress(data, config)` returns a Dash `html.Iframe` whose document
loads the CanvasXpress library from the CDN and renders one interactive chart. `data` and
`config` are exactly the arguments of `new CanvasXpress({...})` in JavaScript. The iframe is
self-contained, so no `external_scripts` wiring is needed.

Example
-------
    from dash import Dash, html
    from canvasxpress_dash import CanvasXpress

    app = Dash(__name__)
    app.layout = html.Div([
        CanvasXpress(
            data={"y": {"vars": ["Revenue"],
                        "smps": ["Q1", "Q2", "Q3", "Q4"],
                        "data": [[10, 14, 9, 17]]}},
            config={"graphType": "Bar", "title": "Quarterly Revenue"},
        )
    ])

    if __name__ == "__main__":
        app.run(debug=True)
"""

import json
import uuid

__all__ = ["CanvasXpress", "render_html", "__version__"]
__version__ = "0.1.0"

CX_JS = "https://www.canvasxpress.org/dist/canvasXpress.min.js"
CX_CSS = "https://www.canvasxpress.org/dist/canvasXpress.css"


def render_html(data=None, config=None, width=600, height=400):
    """Return a self-contained HTML document that renders the chart.

    Loads the CanvasXpress library from the CDN, then instantiates one chart. Kept
    dependency-free so it can be reused and tested without Dash installed.
    """
    data = data or {}
    config = dict(config or {})
    target = "cx_" + uuid.uuid4().hex
    payload = json.dumps(
        {"renderTo": target, "data": data, "config": config,
         "width": width, "height": height}
    )
    return (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<link rel="stylesheet" href="' + CX_CSS + '">'
        '<script src="' + CX_JS + '"></script></head>'
        '<body style="margin:0">'
        '<canvas id="' + target + '" width="' + str(width) + '" height="' + str(height) + '"></canvas>'
        '<script>(function(){'
        'function draw(){new CanvasXpress(' + payload + ');}'
        'if(window.CanvasXpress){draw();}'
        'else{var s=document.querySelector(\'script[src="' + CX_JS + '"]\');'
        'if(s){s.addEventListener("load",draw);}}'
        '})();</script></body></html>'
    )


def CanvasXpress(data=None, config=None, width=600, height=400, id=None, **kwargs):
    """Return a Dash `html.Iframe` that renders a CanvasXpress chart.

    Parameters mirror `new CanvasXpress({...})`: `data` and `config` are the chart spec;
    `width` / `height` size the canvas (pixels). `id` and any extra keyword arguments are
    passed through to the underlying `html.Iframe` (e.g. `className`, `style` overrides).
    """
    from dash import html

    srcdoc = render_html(data=data, config=config, width=width, height=height)
    style = {"width": str(width) + "px", "height": str(height + 15) + "px", "border": "none"}
    style.update(kwargs.pop("style", {}) or {})
    return html.Iframe(
        srcDoc=srcdoc,
        id=id or ("cx_" + uuid.uuid4().hex),
        style=style,
        **kwargs,
    )
