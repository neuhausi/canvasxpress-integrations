// CanvasXpress for JavaScript notebook kernels (Deno, and Node kernels such as
// tslab / ijavascript).
//
// A notebook kernel has no DOM, so `new CanvasXpress({...})` cannot draw a chart
// the way it does in a browser. What it can do is carry the spec and declare how
// it should be displayed: this shim gives the object a Jupyter display
// representation that emits `application/canvasxpress+json`, which the
// CanvasXpress VS Code renderer draws in the cell output.
//
// The call stays the native one — the same `{renderTo, data, config}` arguments
// used in the browser — so notebook code reads like browser code:
//
//   import { CanvasXpress } from "./canvasxpress.mjs";
//
//   new CanvasXpress({
//     renderTo: "chart1",
//     data: { y: { vars: ["Revenue"], smps: ["Q1","Q2"], data: [[10, 14]] } },
//     config: { graphType: "Bar", title: "Quarterly Revenue" },
//   });
//
// In Deno, leaving that as the cell's last expression is enough. In a Node
// kernel, which has no last-expression display hook, pass the bundle to the
// kernel's own display function: `$$.mime(chart.toMimeBundle())`.

export const MIME = "application/canvasxpress+json";

const DISPLAY = Symbol.for("Jupyter.display");

/**
 * A CanvasXpress chart specification that knows how to display itself in a
 * JavaScript notebook kernel.
 *
 * @public
 */
export class CanvasXpress {
  /**
   * @param {object} spec The same arguments accepted by the browser
   *   constructor: `data`, `config`, and optionally `renderTo`, `events`,
   *   `afterRender`, `width`, `height`. Extra keys are carried through
   *   untouched so newer engine options need no change here.
   */
  constructor(spec) {
    if (!spec || typeof spec !== "object") {
      throw new TypeError("CanvasXpress: expected a {data, config} specification");
    }
    if (!spec.data && !spec.config) {
      throw new TypeError("CanvasXpress: specification needs at least `data` or `config`");
    }
    Object.assign(this, spec);
  }

  /**
   * The chart as a plain specification object, without the class wrapper.
   *
   * @returns {object} A `{data, config, ...}` object safe to serialize.
   * @public
   */
  toSpec() {
    return Object.assign({}, this);
  }

  /**
   * The Jupyter mime bundle for this chart. Use with a Node kernel's display
   * helper, e.g. `$$.mime(chart.toMimeBundle())` in tslab or ijavascript.
   *
   * @returns {object} A mime bundle keyed by `application/canvasxpress+json`.
   * @public
   */
  toMimeBundle() {
    return { [MIME]: this.toSpec() };
  }

  /**
   * Deno's Jupyter display hook, called when the object is a cell's last
   * expression or passed to `Deno.jupyter.display`.
   *
   * @returns {object} The mime bundle for the chart.
   * @public
   */
  [DISPLAY]() {
    return this.toMimeBundle();
  }

  /**
   * JSON representation, so `JSON.stringify(chart)` yields the bare spec.
   *
   * @returns {object} A `{data, config, ...}` object.
   * @public
   */
  toJSON() {
    return this.toSpec();
  }
}

/**
 * Build a chart from a row-oriented table, the common case where data is
 * already tabular rather than a hand-written CanvasXpress `y` object. Row keys
 * become `vars`, column names become `smps` — matching what the R and Python
 * packages do with a `data.frame` / `DataFrame`.
 *
 * @param {object} rows Map of row name to a map of column name to value,
 *   e.g. `{ Revenue: { Q1: 10, Q2: 14 } }`.
 * @param {object} [config] CanvasXpress config, e.g. `{graphType: "Bar"}`.
 * @param {object} [rest] Any further constructor arguments (`renderTo`,
 *   `width`, `height`, ...).
 * @returns {CanvasXpress} A chart ready to display.
 * @public
 */
export function fromRows(rows, config, rest) {
  const vars = Object.keys(rows);
  const smps = vars.length ? Object.keys(rows[vars[0]]) : [];
  const data = vars.map(function (v) {
    return smps.map(function (s) {
      const value = rows[v][s];
      return value === undefined ? null : value;
    });
  });
  return new CanvasXpress(
    Object.assign({ data: { y: { vars: vars, smps: smps, data: data } } },
      config ? { config: config } : {},
      rest || {})
  );
}

export default CanvasXpress;
