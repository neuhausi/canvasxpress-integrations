# CanvasXpress for Observable

[CanvasXpress](https://canvasxpress.org) interactive charts in
[Observable](https://observablehq.com) — both Observable Framework and classic notebooks. The
helper returns a self-contained `<iframe>` that loads the library from the CanvasXpress CDN, so
there is nothing to bundle and no chart-container timing to manage.

`spec` is `{data, config}` — exactly the object passed to `new CanvasXpress({...})`, so any
spec from the [gallery](https://canvasxpress.org/examples.html) or the R / Python packages works
unchanged.

## Observable Framework

Copy `canvasxpress.js` into your project (e.g. `src/components/`) and import it:

````md
```js
import {canvasxpress} from "./components/canvasxpress.js";
```

```js
canvasxpress({
  data: {y: {vars: ["Revenue"], smps: ["Q1", "Q2", "Q3", "Q4"], data: [[10, 14, 9, 17]]}},
  config: {graphType: "Bar", title: "Quarterly Revenue"}
})
```
````

## Classic Observable notebook

Import the module straight from a URL in a cell. It is hosted in the public
[`canvasxpress-js`](https://github.com/neuhausi/canvasxpress-js) distribution repo and served
by jsDelivr (which sends the JavaScript MIME type that dynamic `import()` requires — a
`raw.githubusercontent.com` URL does not):

```js
canvasxpress = (await import("https://cdn.jsdelivr.net/gh/neuhausi/canvasxpress-js@master/observable/canvasxpress.js")).canvasxpress
```

Pin a release tag instead of `@master` for reproducibility (e.g. `@67.6.0`).

then in another cell:

```js
canvasxpress({
  data: {y: {vars: ["Revenue"], smps: ["Q1", "Q2", "Q3", "Q4"], data: [[10, 14, 9, 17]]}},
  config: {graphType: "Bar", title: "Quarterly Revenue"}
})
```

## API

```js
canvasxpress(spec, {width = 700, height = 450})   // → <iframe> element
renderHTML(spec, {width, height})                 // → HTML string (no DOM needed)
```

## License

Dual-licensed. The core library is `LGPL-3.0-or-later`; commercial terms are available — see
<https://canvasxpress.org/license.html>.
