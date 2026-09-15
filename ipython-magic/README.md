# canvasxpress-magic

A `%%cxplot` [IPython](https://ipython.org) / Jupyter magic for
[CanvasXpress](https://canvasxpress.org) — render an interactive chart straight from a notebook
cell, no HTML or JavaScript. Works in Jupyter, JupyterLab and VS Code notebooks; the chart is a
self-contained iframe that loads CanvasXpress from the CDN, so there is nothing to build.

## Install

```bash
pip install canvasxpress-magic
```

## Use

```python
%load_ext canvasxpress_magic
```

Cell magic — the cell body is a JSON `{"data", "config"}` spec:

```
%%cxplot
{"data": {"y": {"vars": ["Revenue"],
                "smps": ["Q1", "Q2", "Q3", "Q4"],
                "data": [[10, 14, 9, 17]]}},
 "config": {"graphType": "Bar", "title": "Quarterly Revenue"}}
```

Line magic — render a spec held in a Python variable:

```python
spec = {"data": {...}, "config": {"graphType": "Line"}}
%cxplot spec
```

Both accept sizing flags:

```
%%cxplot --width 800 --height 500
{ ... }
```

`data` and `config` are exactly the arguments of `new CanvasXpress({...})`, so any spec from the
[gallery](https://canvasxpress.org/examples.html) or the R / Python packages works unchanged.

## License

This package is MIT-licensed. The CanvasXpress JavaScript library it loads is distributed separately under the CanvasXpress Community License (Attribution), free with a visible attribution mark and with commercial terms for mark removal — see https://www.canvasxpress.org/license.html.
<https://canvasxpress.org/license.html>.
