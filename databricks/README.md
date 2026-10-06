# CanvasXpress in Databricks notebooks

Render interactive [CanvasXpress](https://canvasxpress.org) charts directly in a
**Databricks notebook** by building a self-contained HTML snippet and handing it to
`displayHTML()`. No cluster libraries, no build step — the chart library is pulled from
the CDN (or inline it for air-gapped workspaces).

This is the *rendering* side of the integration — charting data that already lives in a
Spark / pandas DataFrame. For the *data-source* side — querying a **Databricks SQL
Warehouse** and reshaping the result into a CanvasXpress object served from your own
origin — see the ready-made example in the separate
[`canvasxpress-connectors`](https://github.com/neuhausi/canvasxpress-connectors/tree/main/examples/databricks)
repository (`SqlSource` + the `databricks-sql-connector` SQLAlchemy dialect).

Two worked charts below: a **volcano plot** and a **Kaplan-Meier survival plot**.

> **Public workspace?** There is no anonymous public Databricks instance, but
> [Databricks Free Edition](https://signup.databricks.com) (free, serverless, no credit
> card — the 2025 replacement for Community Edition) runs these notebook examples as-is.

---

## Python

A CanvasXpress data object is `{"y": {"vars": [...], "smps": [...], "data": [[...]]},
"z": {<annotation>: [...]}}`: `vars` are row ids, `smps` are the measured columns,
`data` is the matrix, and `z` holds per-row annotations (used by `colorBy` / `sizeBy`).
One small helper turns any pandas DataFrame into that shape and renders it:

```python
import json, uuid

def to_cx(df, vars_col, smps_cols, annot_cols=None):
    """pandas DataFrame -> CanvasXpress data object."""
    annot_cols = annot_cols or []
    return {
        "y": {
            "vars": df[vars_col].astype(str).tolist(),
            "smps": smps_cols,
            "data": df[smps_cols].values.tolist(),
        },
        "z": {c: df[c].astype(str).tolist() for c in annot_cols},
    }

def cx_display(data, config, cdn="https://www.canvasxpress.org"):
    """Render a CanvasXpress chart in a Databricks notebook cell."""
    cid = "cx_" + uuid.uuid4().hex[:8]
    html = f"""
<link rel="stylesheet" href="{cdn}/dist/canvasXpress.css"/>
<script src="{cdn}/dist/canvasXpress.min.js"></script>
<canvas id="{cid}" width="900" height="600"></canvas>
<script>
  new CanvasXpress({{
    renderTo: "{cid}",
    data: {json.dumps(data)},
    config: {json.dumps(config)}
  }});
</script>"""
    displayHTML(html)   # Databricks built-in
```

### Volcano plot

```python
import pandas as pd

# In practice: spark.table("main.genomics.dge").toPandas()
dge = pd.DataFrame({
    "gene":   [f"Gene{i}" for i in range(1, 7)],
    "AveExpr":[0.94, 0.92, -0.23, 0.33, 0.16, 0.06],
    "logFC":  [1.40, 1.92, -1.15, -1.33, -1.05, 2.31],
    "mlog10p":[3.55, 3.32, 2.82, 2.74, 2.58, 3.90],   # -log10(p-value)
    "FC":     [3.0, 3.0, 2.0, 2.0, 2.0, 3.0],
    "Group":  ["Increased", "Increased", "Decreased", "Decreased", "Decreased", "Increased"],
})

data = to_cx(dge, vars_col="gene",
             smps_cols=["AveExpr", "logFC", "mlog10p"],
             annot_cols=["FC", "Group"])

config = {
    "graphType": "Scatter2D",
    "title": "Publication-ready volcano plot",
    "subtitle": "Differential expression",
    "xAxis": ["logFC"],
    "yAxis": ["mlog10p"],
    "xAxisTitle": "log2 fold change",
    "yAxisTitle": "-log10 p-value",
    "colorBy": "Group",
    "colorKey": {"Group": {
        "Increased": "rgba(197,27,38,0.75)",
        "Decreased": "rgba(33,102,172,0.75)",
        "NoChange":  "rgba(150,150,150,0.35)",
    }},
    "sizeBy": "FC",
    "sizes": [3, 6, 9, 12, 15],
    "legendBox": True,
    "showDecorations": True,
    "decorations": {"line": [
        {"color": "rgba(120,120,120,0.8)", "width": 1, "x": 1},
        {"color": "rgba(120,120,120,0.8)", "width": 1, "x": -1},
        {"color": "rgba(120,120,120,0.8)", "width": 1, "y": 1.301},  # p = 0.05
    ]},
    "labelBy": "gene",
    "hoverTemplate": "Gene: {vars}<br/>log2FC: {logFC}<br/>-log10 p: {mlog10p}<br/>{Group}",
}

cx_display(data, config)
```

### Kaplan-Meier survival plot

For a KM plot the measured columns are the follow-up `time` and the event `status`
(1 = event, 0 = censored); the treatment arm lives in `z` and drives `colorBy`.
`kmRiskTable`, `showKMConfidenceIntervals`, and `showKMMedianSurvivalTime` turn on the
survival-specific overlays.

```python
# In practice: spark.table("main.clinical.survival").toPandas()
surv = pd.DataFrame({
    "subject": [f"S{i}" for i in range(1, 9)],
    "time":    [24, 3, 11, 19, 24, 13, 14, 2],
    "status":  [0, 1, 0, 0, 0, 1, 1, 0],
    "arm":     ["Treatment", "Treatment", "Treatment", "Treatment",
                "Control", "Control", "Control", "Control"],
})

data = to_cx(surv, vars_col="subject",
             smps_cols=["time", "status"],
             annot_cols=["arm"])

config = {
    "graphType": "Scatter2D",
    "title": "Overall survival by treatment arm",
    "xAxis": ["time"],
    "yAxis": ["status"],
    "xAxisTitle": "Time (months)",
    "yAxisTitle": "Survival probability",
    "colorBy": "arm",
    "colors": ["#2E9FDF", "#E7B800"],
    "kmRiskTable": True,
    "showKMConfidenceIntervals": True,
    "showKMMedianSurvivalTime": True,
    "legendColumns": 2,
    "legendPosition": "top",
}

cx_display(data, config)
```

---

## R

Databricks R notebooks also expose `displayHTML()`. Use the CRAN `canvasXpress` package to
build the widget, save it self-contained, and display the HTML:

```r
# %r
install.packages("canvasXpress")   # once per cluster
library(canvasXpress)
library(htmlwidgets)

cx_display <- function(widget) {
  f <- tempfile(fileext = ".html")
  saveWidget(widget, f, selfcontained = TRUE)
  displayHTML(paste(readLines(f, warn = FALSE), collapse = "\n"))
}

# Volcano: a data.frame with genes as row names, measures as columns,
# and Group/FC as variable annotations (varAnnot).
dge <- data.frame(
  AveExpr = c(0.94, 0.92, -0.23, 0.33, 0.16, 0.06),
  logFC   = c(1.40, 1.92, -1.15, -1.33, -1.05, 2.31),
  mlog10p = c(3.55, 3.32, 2.82, 2.74, 2.58, 3.90),
  row.names = paste0("Gene", 1:6)
)
varAnnot <- data.frame(
  Group = c("Increased","Increased","Decreased","Decreased","Decreased","Increased"),
  FC    = c(3, 3, 2, 2, 2, 3),
  row.names = rownames(dge)
)

cx_display(canvasXpress(
  data       = dge,
  varAnnot   = varAnnot,
  graphType  = "Scatter2D",
  title      = "Publication-ready volcano plot",
  xAxis      = list("logFC"),
  yAxis      = list("mlog10p"),
  colorBy    = "Group",
  sizeBy     = "FC"
))
```

A Kaplan-Meier plot follows the same pattern — `time` / `status` as the data columns, the
treatment arm in `varAnnot`, and `kmRiskTable = TRUE` on the config.

---

## Air-gapped workspaces

The Python helper loads the library from the CanvasXpress CDN. If your Databricks
workspace has no outbound internet, upload `canvasXpress.min.js` + `canvasXpress.css` to
**DBFS / a Unity Catalog volume**, read them into strings, and inline them into the HTML
instead of the two `<link>`/`<script>` tags. The R path is already self-contained
(`saveWidget(selfcontained = TRUE)` vendors the assets).

## License

This directory contains documentation and example snippets only, MIT-licensed. The
CanvasXpress JavaScript library is distributed separately under the CanvasXpress Community
License (Attribution) — see <https://canvasxpress.org/license.html>.
