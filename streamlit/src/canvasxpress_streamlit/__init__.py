"""CanvasXpress charts in Streamlit apps.

A no-build Streamlit component: `canvasxpress(data, config)` renders an interactive
CanvasXpress chart by loading the library from the CanvasXpress CDN inside Streamlit's
component iframe. `data` and `config` are exactly the arguments of
`new CanvasXpress({...})` in JavaScript.

Example
-------
    import streamlit as st
    from canvasxpress_streamlit import canvasxpress

    canvasxpress(
        data={"y": {"vars": ["Revenue"],
                    "smps": ["Q1", "Q2", "Q3", "Q4"],
                    "data": [[10, 14, 9, 17]]}},
        config={"graphType": "Bar", "title": "Quarterly Revenue"},
    )
"""

import json
import uuid

__all__ = ["canvasxpress", "render_html", "__version__"]
__version__ = "0.1.0"

CX_JS = "https://www.canvasxpress.org/dist/canvasXpress.min.js"
CX_CSS = "https://www.canvasxpress.org/dist/canvasXpress.css"


def render_html(data=None, config=None, width=600, height=400):
    """Return a self-contained HTML document that renders the chart.

    Loads the CanvasXpress library from the CDN, then instantiates one chart. Kept
    dependency-free so it can be reused and tested without Streamlit installed.
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


def canvasxpress(data=None, config=None, width=600, height=400, key=None):
    """Render a CanvasXpress chart in a Streamlit app.

    Parameters mirror `new CanvasXpress({...})`: `data` and `config` are the chart
    spec; `width` / `height` size the canvas (pixels). `key` is an optional Streamlit
    widget key. Returns the Streamlit component handle.
    """
    import streamlit.components.v1 as components

    html = render_html(data=data, config=config, width=width, height=height)
    return components.html(html, height=height + 15, width=width, scrolling=False)
