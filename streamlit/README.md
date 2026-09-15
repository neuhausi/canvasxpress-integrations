# canvasxpress-streamlit

[CanvasXpress](https://canvasxpress.org) interactive charts in [Streamlit](https://streamlit.io)
apps — no JavaScript build step. The library is loaded from the CanvasXpress CDN inside
Streamlit's component iframe.

## Install

```bash
pip install canvasxpress-streamlit
```

## Use

```python
import streamlit as st
from canvasxpress_streamlit import canvasxpress

st.title("CanvasXpress in Streamlit")

canvasxpress(
    data={
        "y": {
            "vars": ["Revenue"],
            "smps": ["Q1", "Q2", "Q3", "Q4"],
            "data": [[10, 14, 9, 17]],
        }
    },
    config={"graphType": "Bar", "title": "Quarterly Revenue"},
    height=420,
)
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
| `key`    | str  | `None`  | Optional Streamlit widget key. |

## License

This package is MIT-licensed. The CanvasXpress JavaScript library it loads is distributed separately under the CanvasXpress Community License (Attribution), free with a visible attribution mark and with commercial terms for mark removal — see https://www.canvasxpress.org/license.html.
<https://canvasxpress.org/license.html>.
