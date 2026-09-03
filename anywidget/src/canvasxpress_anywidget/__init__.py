"""CanvasXpress charts as anywidget widgets.

Renders a CanvasXpress visualization inside Jupyter, JupyterLab, Google Colab,
VS Code notebooks and marimo through the anywidget protocol. The library is
loaded from the CanvasXpress CDN in the browser, so no bundling step is needed.

Example
-------
    from canvasxpress_anywidget import CanvasXpress

    CanvasXpress(
        data={"y": {"vars": ["Revenue"],
                    "smps": ["Q1", "Q2", "Q3", "Q4"],
                    "data": [[10, 14, 9, 17]]}},
        config={"graphType": "Bar", "title": "Quarterly Revenue"},
    )
"""

import pathlib

import anywidget
import traitlets

__all__ = ["CanvasXpress", "__version__"]
__version__ = "0.1.0"

_STATIC = pathlib.Path(__file__).parent / "static"


class CanvasXpress(anywidget.AnyWidget):
    """A CanvasXpress chart as a notebook widget.

    Parameters mirror ``new CanvasXpress({...})`` in JavaScript: ``data`` and
    ``config`` are the chart spec, ``events`` are optional event handlers, and
    ``width`` / ``height`` size the canvas. Assigning to any of these attributes
    after creation re-renders the chart in place.
    """

    _esm = _STATIC / "widget.js"

    data = traitlets.Dict().tag(sync=True)
    config = traitlets.Dict().tag(sync=True)
    events = traitlets.Dict().tag(sync=True)
    width = traitlets.Int(600).tag(sync=True)
    height = traitlets.Int(400).tag(sync=True)

    def __init__(self, data=None, config=None, events=None,
                 width=600, height=400, **kwargs):
        super().__init__(
            data=data or {},
            config=config or {},
            events=events or {},
            width=width,
            height=height,
            **kwargs,
        )

    @classmethod
    def from_spec(cls, spec, **kwargs):
        """Build a widget from a ``{"data", "config", "events"}`` spec dict.

        Accepts the same JSON object used by the CanvasXpress reproducible-research
        export and by the Quarto shortcode, so a spec can be shared across hosts.
        """
        return cls(
            data=spec.get("data"),
            config=spec.get("config"),
            events=spec.get("events"),
            **kwargs,
        )
