--[[
  CanvasXpress Quarto shortcode.

  Embeds an interactive CanvasXpress chart in an HTML Quarto document from a JSON spec file:

      {{< canvasxpress spec.json >}}
      {{< canvasxpress spec="spec.json" width="700" height="500" >}}

  The spec file is a JSON object with `data` and `config` keys (optionally `events`), i.e. the
  arguments to `new CanvasXpress({...})`. The CanvasXpress library (CSS + JS) is injected into
  the document head once, from the CDN. HTML formats only; other formats emit a note.
]]

local injected = false

-- Inject the CanvasXpress library into <head> exactly once per document.
local function ensure_deps()
  if injected then return end
  injected = true
  quarto.doc.include_text('in-header',
    '<link rel="stylesheet" href="https://www.canvasxpress.org/dist/canvasXpress.css">')
  quarto.doc.include_text('in-header',
    '<script src="https://www.canvasxpress.org/dist/canvasXpress.min.js"></script>')
end

-- Read an entire file into a string, or nil.
local function read_file(path)
  local fh = io.open(path, 'r')
  if not fh then return nil end
  local content = fh:read('*a')
  fh:close()
  return content
end

local counter = 0

return {
  ['canvasxpress'] = function(args, kwargs, meta)
    -- HTML only — a CanvasXpress chart is interactive canvas.
    if not quarto.doc.is_format('html:js') then
      return pandoc.Null()
    end

    -- Resolve the spec path from a positional arg or the `spec=` keyword.
    local spec_path = nil
    if kwargs['spec'] and #pandoc.utils.stringify(kwargs['spec']) > 0 then
      spec_path = pandoc.utils.stringify(kwargs['spec'])
    elseif args[1] then
      spec_path = pandoc.utils.stringify(args[1])
    end
    if not spec_path then
      return pandoc.RawBlock('html',
        '<div class="cx-error">canvasxpress: no spec file given</div>')
    end

    local spec = read_file(spec_path)
    if not spec then
      return pandoc.RawBlock('html',
        '<div class="cx-error">canvasxpress: cannot read spec "' .. spec_path .. '"</div>')
    end

    local width  = kwargs['width']  and pandoc.utils.stringify(kwargs['width'])  or '600'
    local height = kwargs['height'] and pandoc.utils.stringify(kwargs['height']) or '400'

    ensure_deps()
    counter = counter + 1
    local id = 'cx-' .. tostring(counter)

    -- The spec JSON is valid JS; stamp renderTo and construct. Escape a closing script tag.
    spec = spec:gsub('</', '<\\/')
    local html = table.concat({
      '<canvas id="', id, '" width="', width, '" height="', height, '"></canvas>\n',
      '<script>\n',
      '  (function () {\n',
      '    var spec = ', spec, ';\n',
      '    spec.renderTo = "', id, '";\n',
      '    new CanvasXpress(spec);\n',
      '  })();\n',
      '</script>'
    })
    return pandoc.RawBlock('html', html)
  end
}
