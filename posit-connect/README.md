# CanvasXpress on Posit Connect (RStudio Connect)

CanvasXpress ships as an R [htmlwidget](https://www.htmlwidgets.org/), so there is no
special connector to install for [Posit Connect](https://posit.co/products/enterprise/connect/)
(formerly RStudio Connect). The widget rides inside whatever content type you publish —
Shiny apps, R Markdown / Quarto documents, and Plumber APIs all work. This directory
collects a minimal, deployable example for each.

CanvasXpress htmlwidgets **self-contain their JS/CSS** (no CDN call at render time), so
these examples also work on air-gapped / internet-isolated Connect servers.

## Install the chart library

On the Connect host (or in your project library / `renv`):

```r
install.packages("canvasXpress")   # from CRAN
```

The relevant exports are `canvasXpress()` (build a chart), plus `canvasXpressOutput()`
and `renderCanvasXpress()` for Shiny.

## Content types

### 1. Shiny app

`canvasXpressOutput()` / `renderCanvasXpress()` drop into Shiny like any other widget.

```r
# app.R
library(shiny)
library(canvasXpress)

ui <- fluidPage(
  titlePanel("CanvasXpress on Posit Connect"),
  canvasXpressOutput("plot", width = "100%", height = "600px")
)

server <- function(input, output, session) {
  output$plot <- renderCanvasXpress({
    y <- read.table("https://www.canvasxpress.org/data/cX-irist-dat.txt",
                    header = TRUE, sep = "\t", row.names = 1)
    canvasXpress(data = y, graphType = "Scatter2D", colorBy = "Species")
  })
}

shinyApp(ui, server)
```

Publish from the RStudio / Positron IDE with the **Publish** button, or programmatically:

```r
rsconnect::deployApp(appDir = ".", appName = "canvasxpress-shiny")
```

### 2. R Markdown / Quarto document

Embed a `canvasXpress()` call in a code chunk. The widget assets are vendored into the
self-contained HTML automatically.

````markdown
---
title: "CanvasXpress report"
output: html_document      # or: format: html  (Quarto .qmd)
---

```{r}
library(canvasXpress)
y <- read.table("https://www.canvasxpress.org/data/cX-irist-dat.txt",
                header = TRUE, sep = "\t", row.names = 1)
canvasXpress(data = y, graphType = "Scatter2D", colorBy = "Species")
```
````

Publish:

```r
rsconnect::deployDoc("report.Rmd")   # or deployDoc("report.qmd")
```

> For a shortcode-driven Quarto workflow (`{{< canvasxpress spec.json >}}`), see the
> sibling [`quarto/`](../quarto/) extension — it publishes to Connect the same way.

### 3. Plumber API

Render a widget to a self-contained HTML string and return it from an endpoint — useful
for embedding a chart in another app or service.

```r
# plumber.R
library(plumber)
library(canvasXpress)
library(htmlwidgets)

#* Return a CanvasXpress chart as a standalone HTML page
#* @serializer html
#* @get /chart
function() {
  y <- read.table("https://www.canvasxpress.org/data/cX-irist-dat.txt",
                  header = TRUE, sep = "\t", row.names = 1)
  widget <- canvasXpress(data = y, graphType = "Scatter2D", colorBy = "Species")

  tmp <- tempfile(fileext = ".html")
  saveWidget(widget, tmp, selfcontained = TRUE)
  paste(readLines(tmp, warn = FALSE), collapse = "\n")
}
```

Publish:

```r
rsconnect::deployAPI(api = ".", apiName = "canvasxpress-api")
```

## Connect deployment notes

- **Dependency pinning.** Use [`renv`](https://rstudio.github.io/renv/) so Connect
  reproduces the exact `canvasXpress` version. `rsconnect` captures the project library
  into `manifest.json` at publish time — confirm `canvasXpress` is listed with
  `rsconnect::writeManifest()`.
- **Air-gapped Connect.** The widgets self-contain their assets, so charts render with
  no outbound network call. (The data-loading line in the examples above *does* fetch a
  sample file over HTTPS — replace it with your own in-package data on isolated servers.)
- **Version.** `canvasXpress` on CRAN tracks the engine releases; `install.packages()`
  or `renv::restore()` on the Connect host keeps it current.

## License

This directory contains documentation and example snippets only, MIT-licensed. The
CanvasXpress JavaScript library is distributed separately under the CanvasXpress
Community License (Attribution) — see <https://canvasxpress.org/license.html>.
