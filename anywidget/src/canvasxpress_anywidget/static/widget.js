// CanvasXpress anywidget front-end (ESM).
//
// anywidget renders this module in Jupyter, JupyterLab, Google Colab, VS Code
// notebooks and marimo. CanvasXpress itself ships as a UMD/global bundle, so we
// inject its CSS + JS from the CDN exactly once per page, wait for the global,
// then instantiate a chart per widget. Re-renders on any trait change.

var CX_JS = "https://www.canvasxpress.org/dist/canvasXpress.min.js";
var CX_CSS = "https://www.canvasxpress.org/dist/canvasXpress.css";

var _loading = null;

// Load the CanvasXpress library once; resolve with the global constructor.
function loadCanvasXpress() {
  if (window.CanvasXpress) {
    return Promise.resolve(window.CanvasXpress);
  }
  if (_loading) {
    return _loading;
  }
  _loading = new Promise(function (resolve, reject) {
    if (!document.querySelector('link[data-canvasxpress-css]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CX_CSS;
      link.setAttribute("data-canvasxpress-css", "1");
      document.head.appendChild(link);
    }
    var existing = document.querySelector("script[data-canvasxpress]");
    if (existing) {
      existing.addEventListener("load", function () { resolve(window.CanvasXpress); });
      existing.addEventListener("error", reject);
      return;
    }
    var script = document.createElement("script");
    script.src = CX_JS;
    script.setAttribute("data-canvasxpress", "1");
    script.onload = function () { resolve(window.CanvasXpress); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _loading;
}

var _uid = 0;

function render(params) {
  var model = params.model;
  var el = params.el;
  var instance = null;

  function currentSize() {
    return { width: model.get("width") || 600, height: model.get("height") || 400 };
  }

  el.innerHTML = "";
  var size = currentSize();
  var canvas = document.createElement("canvas");
  var id = "cx_" + Date.now() + "_" + (_uid++);
  canvas.id = id;
  canvas.width = size.width;
  canvas.height = size.height;
  el.appendChild(canvas);

  function draw(CanvasXpress) {
    var sz = currentSize();
    canvas.width = sz.width;
    canvas.height = sz.height;
    if (instance && typeof instance.destroy === "function") {
      try { instance.destroy(); } catch (e) { /* ignore */ }
    }
    instance = new CanvasXpress({
      renderTo: id,
      data: model.get("data") || {},
      config: Object.assign({}, model.get("config") || {}),
      events: model.get("events") || {},
      width: sz.width,
      height: sz.height
    });
  }

  function update() {
    loadCanvasXpress().then(draw).catch(function (e) {
      el.innerHTML = '<div style="color:#b00020;font:13px system-ui">' +
        "Failed to load CanvasXpress: " + e + "</div>";
    });
  }

  update();
  model.on("change:data", update);
  model.on("change:config", update);
  model.on("change:events", update);
  model.on("change:width", update);
  model.on("change:height", update);

  return function () {
    model.off("change:data", update);
    model.off("change:config", update);
    model.off("change:events", update);
    model.off("change:width", update);
    model.off("change:height", update);
    if (instance && typeof instance.destroy === "function") {
      try { instance.destroy(); } catch (e) { /* ignore */ }
    }
  };
}

export default { render: render };
