"""A ``%%cxplot`` IPython magic for CanvasXpress.

Render a CanvasXpress chart from a notebook cell without writing any HTML or
JavaScript. Load the extension, then put a chart spec in a cell:

    %load_ext canvasxpress_magic

    %%cxplot
    {"data": {"y": {"vars": ["Revenue"],
                    "smps": ["Q1", "Q2", "Q3", "Q4"],
                    "data": [[10, 14, 9, 17]]}},
     "config": {"graphType": "Bar", "title": "Quarterly Revenue"}}

The cell body is a JSON `{"data", "config"}` object. A line magic renders a spec
held in a Python variable:

    %cxplot my_spec

The chart is emitted as a self-contained iframe that loads CanvasXpress from the
CDN, so it works in Jupyter, JupyterLab and VS Code notebooks with nothing to build.
"""

import json
import uuid

from IPython.core.error import UsageError
from IPython.core.magic import Magics, line_cell_magic, magics_class
from IPython.core.magic_arguments import argument, magic_arguments, parse_argstring
from IPython.display import HTML

__all__ = ["CanvasXpressMagics", "load_ipython_extension", "render_html", "__version__"]
__version__ = "0.1.0"

CX_JS = "https://www.canvasxpress.org/dist/canvasXpress.min.js"
CX_CSS = "https://www.canvasxpress.org/dist/canvasXpress.css"


def render_html(data=None, config=None, width=600, height=400):
    """Return a self-contained HTML document (as an iframe srcdoc) for one chart.

    Kept free of IPython so it can be reused and tested directly.
    """
    data = data or {}
    config = dict(config or {})
    target = "cx_" + uuid.uuid4().hex
    payload = json.dumps(
        {"renderTo": target, "data": data, "config": config,
         "width": width, "height": height}
    )
    doc = (
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
    srcdoc = doc.replace('"', "&quot;")
    return (
        '<iframe srcdoc="' + srcdoc + '" width="' + str(width) +
        '" height="' + str(height + 15) + '" style="border:none"></iframe>'
    )


@magics_class
class CanvasXpressMagics(Magics):
    """IPython magics that render CanvasXpress charts."""

    @magic_arguments()
    @argument("spec", nargs="?", default=None,
              help="Line magic only: name of a Python variable holding a "
                   "{'data','config'} dict. Ignored when used as a cell magic.")
    @argument("--width", type=int, default=600, help="Canvas width in pixels.")
    @argument("--height", type=int, default=400, help="Canvas height in pixels.")
    @line_cell_magic
    def cxplot(self, line, cell=None):
        """Render a CanvasXpress chart.

        As a cell magic (``%%cxplot``) the cell body is a JSON `{"data", "config"}`
        spec. As a line magic (``%cxplot my_spec``) the spec comes from a Python
        variable. Both accept ``--width`` / ``--height``.
        """
        args = parse_argstring(self.cxplot, line)
        if cell is not None:
            spec = json.loads(cell)
        elif args.spec is not None:
            spec = self.shell.user_ns[args.spec]
        else:
            raise UsageError(
                "provide a spec variable name (%cxplot my_spec) or use as a "
                "cell magic (%%cxplot with a JSON body)."
            )
        return HTML(render_html(
            data=spec.get("data"), config=spec.get("config"),
            width=args.width, height=args.height,
        ))


def load_ipython_extension(ipython):
    """Register the magics (called by ``%load_ext canvasxpress_magic``)."""
    ipython.register_magics(CanvasXpressMagics)
