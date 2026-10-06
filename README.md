# CanvasXpress Integrations

First-party packages that bring [CanvasXpress](https://canvasxpress.org) interactive
charts into the tools where people already work — notebooks, dashboards, publishing
systems, and editors. Each subdirectory is a self-contained, independently published
package with its own README, version, and license.

CanvasXpress is a JavaScript visualization library for exploratory and publication-quality
charts. These integrations wrap it so you can render the same charts from Python, R,
Quarto, Observable, and VS Code without writing any JavaScript or running a build step.

## Packages

| Directory | Package | Distributed via | What it does |
|-----------|---------|-----------------|--------------|
| [`anywidget/`](anywidget/) | `canvasxpress-anywidget` | PyPI | CanvasXpress charts as Jupyter / Colab / VS Code / marimo notebook widgets (built on [anywidget](https://anywidget.dev)). |
| [`streamlit/`](streamlit/) | `canvasxpress-streamlit` | PyPI | CanvasXpress charts in Streamlit apps, no build step. |
| [`dash/`](dash/) | `canvasxpress-dash` | PyPI | CanvasXpress charts in Plotly Dash apps, no build step. |
| [`ipython-magic/`](ipython-magic/) | `canvasxpress-magic` | PyPI | A `%%cxplot` IPython/Jupyter cell magic for quick charts. |
| [`vscode/`](vscode/) | `canvasxpress-vscode` | VS Code Marketplace | Notebook-output renderer for the `application/canvasxpress+json` MIME type. |
| [`quarto/`](quarto/) | CanvasXpress Quarto extension | Quarto | A `{{< canvasxpress >}}` shortcode for Quarto documents. |
| [`observable/`](observable/) | CanvasXpress for Observable | Observable / jsDelivr | An ES module for Observable notebooks. |
| [`posit-connect/`](posit-connect/) | Posit Connect examples | docs only | Deploy CanvasXpress on Posit Connect (RStudio Connect) via Shiny, R Markdown / Quarto, or Plumber. |
| [`databricks/`](databricks/) | Databricks notebook examples | docs only | Render CanvasXpress charts in Databricks notebooks via `displayHTML()` (volcano + Kaplan-Meier, Python & R). |
| [`bioconductor/CanvasXpressBio/`](bioconductor/CanvasXpressBio/) | `CanvasXpressBio` | Bioconductor | CanvasXpress visualizations for Bioconductor data structures (e.g. `SummarizedExperiment`). |

## Installation

```bash
# Python (PyPI)
pip install canvasxpress-anywidget      # Jupyter / Colab / VS Code / marimo
pip install canvasxpress-streamlit      # Streamlit
pip install canvasxpress-dash           # Dash
pip install canvasxpress-magic          # %%cxplot magic
```

```r
# R (Bioconductor)
BiocManager::install("CanvasXpressBio")
```

```bash
# Quarto
quarto add neuhausi/canvasxpress-quarto
```

The VS Code renderer is on the Marketplace as **CanvasXpress Notebook Renderer**
(publisher `canvasxpress`). The Observable module is served from jsDelivr.

See each package's own README for usage, examples, and API details.

## Related repositories

- [`canvasxpress-connectors`](https://github.com/neuhausi/canvasxpress-connectors) — feed
  CanvasXpress from **authenticated data sources** (SQL databases incl. Databricks SQL
  Warehouses, Google Sheets, GA4, Salesforce, ServiceNow) by reshaping query results into
  CanvasXpress data objects served from your own origin, so the browser never holds a
  credential. The integrations here *render* charts; the connectors repo *supplies the data*.

## Resources

- CanvasXpress home: <https://canvasxpress.org>
- Documentation & gallery: <https://canvasxpress.org>
- Core library source: <https://github.com/neuhausi/canvasXpress>

## Contributing

Issues and pull requests are welcome. Please open issues against the specific package
you are using and include a minimal reproducible example.

## License

Each package carries its own `LICENSE`. The Python integrations are MIT-licensed;
`CanvasXpressBio` follows Bioconductor conventions. See the individual package
directories for details.
