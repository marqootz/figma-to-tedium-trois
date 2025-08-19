// Simple Figma plugin without complex bundling

// HTML Generator
class HTMLGenerator {
  generateHTML(nodes) {
    var css = this.generateCSS(nodes);
    var bodyHTML = this.generateBodyHTML(nodes);
    var javascript = this.generateJavaScript(nodes);

    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>Figma Export</title>\n' +
'  <style>\n' +
'    /* Reset and base styles */\n' +
'    * {\n' +
'      margin: 0;\n' +
'      padding: 0;\n' +
'      box-sizing: border-box;\n' +
'    }\n' +
'    \n' +
'    body {\n' +
'      font-family: system-ui, -apple-system, sans-serif;\n' +
'      background-color: #f5f5f5;\n' +
'      overflow: hidden;\n' +
'    }\n' +
'    \n' +
'    /* Component styles */\n' +
css +
'\n  </style>\n' +
'</head>\n' +
'<body>\n' +
'  ' + bodyHTML + '\n' +
'  <script>\n' +
'    ' + javascript + '\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
  }

  generateCSS(nodes) {
    var self = this;
    return nodes.map(function(node) { return self.generateStyles(node); }).join('\n\n');
  }

  generateBodyHTML(nodes) {
    var self = this;
    return nodes.map(function(node) { return self.buildElement(node); }).join('\n');
  }

  generateJavaScript(nodes) {
    return this.generateAnimationCode(nodes);
  }

  generateStyles(node) {
    var selector = '[data-figma-id="' + node.id + '"]';
    var properties = this.generateCSSProperties(node);
    var self = this;
    
    var css = selector + ' {\n' + properties + '\n}';
    
    if (node.children) {
      var childStyles = node.children
        .map(function(child) { return self.generateStyles(child); })
        .join('\n\n');
      css += '\n\n' + childStyles;
    }
    
    return css;
  }

  generateCSSProperties(node) {
    var properties = [];

    properties.push('position: absolute;');
    properties.push('left: ' + node.x + 'px;');
    properties.push('top: ' + node.y + 'px;');
    properties.push('width: ' + node.width + 'px;');
    properties.push('height: ' + node.height + 'px;');

    if (node.opacity !== undefined && node.opacity !== 1) {
      properties.push('opacity: ' + node.opacity + ';');
    }

    // Background fills
    if (node.fills && node.fills.length > 0) {
      var backgroundCSS = this.generateBackgroundCSS(node.fills);
      if (backgroundCSS) {
        properties.push(backgroundCSS);
      }
    }

    // Borders/strokes
    if (node.strokes && node.strokes.length > 0) {
      var borderCSS = this.generateBorderCSS(node.strokes, node.strokeWeight);
      if (borderCSS) {
        properties.push(borderCSS);
      }
    }

    if (node.layoutMode && node.layoutMode !== 'NONE') {
      properties.push('display: flex;');
      
      if (node.layoutMode === 'HORIZONTAL') {
        properties.push('flex-direction: row;');
      } else if (node.layoutMode === 'VERTICAL') {
        properties.push('flex-direction: column;');
      }

      if (node.counterAxisAlignItems) {
        var alignMap = {
          'MIN': 'flex-start',
          'CENTER': 'center',
          'MAX': 'flex-end'
        };
        properties.push('align-items: ' + alignMap[node.counterAxisAlignItems] + ';');
      }

      if (node.primaryAxisAlignItems) {
        var justifyMap = {
          'MIN': 'flex-start',
          'CENTER': 'center', 
          'MAX': 'flex-end'
        };
        properties.push('justify-content: ' + justifyMap[node.primaryAxisAlignItems] + ';');
      }
    }

    if (node.type === 'COMPONENT_SET') {
      properties.push('position: relative;');
    }

    if (node.type === 'COMPONENT') {
      properties.push('display: none;');
    }

    if (node.type === 'TEXT') {
      properties.push('font-family: system-ui, -apple-system, sans-serif;');
      properties.push('display: flex;');
      properties.push('align-items: center;');
      properties.push('justify-content: center;');
      
      // Text-specific properties
      if (node.fontSize) {
        properties.push('font-size: ' + node.fontSize + 'px;');
      }
      if (node.fontWeight) {
        properties.push('font-weight: ' + node.fontWeight + ';');
      }
      if (node.textAlignHorizontal) {
        var textAlignMap = {
          'LEFT': 'left',
          'CENTER': 'center',
          'RIGHT': 'right'
        };
        properties.push('text-align: ' + (textAlignMap[node.textAlignHorizontal] || 'left') + ';');
      }
    }

    if (node.type === 'VECTOR') {
      // Ensure vectors display properly
      properties.push('display: block;');
      properties.push('overflow: visible;');
    }

    return properties.map(function(prop) { return '  ' + prop; }).join('\n');
  }

  generateBackgroundCSS(fills) {
    if (!fills || fills.length === 0) return null;

    const solidFill = fills.find(function(fill) { return fill.type === 'SOLID' && fill.color; });
    
    if (solidFill && solidFill.color) {
      const r = solidFill.color.r;
      const g = solidFill.color.g;
      const b = solidFill.color.b;
      const alpha = solidFill.opacity || 1;
      return 'background-color: rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + alpha + ');';
    }

    // Handle gradients (simplified)
    const gradientFill = fills.find(function(fill) {
      return (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') && 
      fill.gradientStops;
    });
    
    if (gradientFill && gradientFill.gradientStops) {
      const stops = gradientFill.gradientStops.map(function(stop) {
        const r = stop.color.r;
        const g = stop.color.g;
        const b = stop.color.b;
        const alpha = gradientFill.opacity || 1;
        return 'rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + alpha + ') ' + Math.round(stop.position * 100) + '%';
      }).join(', ');
      
      const gradientType = gradientFill.type === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient';
      return 'background: ' + gradientType + '(' + stops + ');';
    }

    return null;
  }

  generateBorderCSS(strokes, strokeWeight) {
    if (!strokes || strokes.length === 0) return null;

    const strokeFill = strokes.find(function(stroke) { return stroke.type === 'SOLID' && stroke.color; });
    
    if (strokeFill && strokeFill.color) {
      const r = strokeFill.color.r;
      const g = strokeFill.color.g;
      const b = strokeFill.color.b;
      const alpha = strokeFill.opacity || 1;
      const weight = strokeWeight || 1;
      return 'border: ' + weight + 'px solid rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + alpha + ');';
    }

    return null;
  }

  buildElement(node) {
    const attributes = this.generateAttributes(node);
    const content = this.generateContent(node);
    const tag = this.getHTMLTag(node);

    return '<' + tag + attributes + '>' + content + '</' + tag + '>';
  }

  generateAttributes(node) {
    const attrs = [
      'data-figma-id="' + node.id + '"',
      'data-figma-name="' + node.name + '"',
      'data-figma-type="' + node.type + '"'
    ];

    if (node.type === 'COMPONENT_SET') {
      attrs.push('data-component-set="true"');
    }

    if (node.type === 'COMPONENT') {
      attrs.push('data-variant="true"');
    }

    if (node.type === 'VECTOR') {
      // Add SVG-specific attributes
      attrs.push('width="' + node.width + '"');
      attrs.push('height="' + node.height + '"');
      attrs.push('viewBox="0 0 ' + node.width + ' ' + node.height + '"');
      attrs.push('xmlns="http://www.w3.org/2000/svg"');
    }

    if (node.reactions && node.reactions.length > 0) {
      attrs.push('data-reactions=\'' + JSON.stringify(node.reactions) + '\'');
    }

    return ' ' + attrs.join(' ');
  }

  generateContent(node) {
    if (node.children) {
      var self = this;
      return node.children.map(function(child) { return self.buildElement(child); }).join('\n');
    }

    if (node.type === 'TEXT') {
      return node.characters || node.name;
    }

    if (node.type === 'VECTOR' && node.svgContent) {
      // Extract the SVG content and clean it up
      const svgMatch = node.svgContent.match(/<svg[^>]*>(.*?)<\/svg>/s);
      if (svgMatch) {
        return svgMatch[1]; // Return inner SVG content
      }
      return node.svgContent; // Fallback to full SVG
    }

    return '';
  }

  getHTMLTag(node) {
    switch (node.type) {
      case 'COMPONENT_SET':
      case 'COMPONENT':
      case 'INSTANCE':
      case 'FRAME':
        return 'div';
      case 'TEXT':
        return 'span';
      case 'VECTOR':
        return 'svg';
      default:
        return 'div';
    }
  }

  generateAnimationCode(nodes) {
    return 'function FigmaAnimationSystem() {\n' +
    '  this.elementRegistry = {};\n' +
    '  this.nodeRegistry = {};\n' +
    '  this.timeouts = [];\n' +
    '  console.log("FigmaAnimationSystem initialized");\n' +
    '}\n' +
    '\n' +
    'FigmaAnimationSystem.prototype.registerElement = function(figmaId, element, node) {\n' +
    '  this.elementRegistry[figmaId] = element;\n' +
    '  this.nodeRegistry[figmaId] = node;\n' +
    '  element.setAttribute("data-figma-id", figmaId);\n' +
    '  console.log("Registered element:", figmaId, node.name);\n' +
    '};\n' +
    '\n' +
    'FigmaAnimationSystem.prototype.executeAnimation = function(sourceId, targetId) {\n' +
    '  console.log("Executing animation:", sourceId, "→", targetId);\n' +
    '  var sourceElement = this.elementRegistry[sourceId];\n' +
    '  var targetElement = this.elementRegistry[targetId];\n' +
    '  var sourceNode = this.nodeRegistry[sourceId];\n' +
    '  if (!sourceElement || !targetElement) {\n' +
    '    console.error("Missing elements for animation");\n' +
    '    return;\n' +
    '  }\n' +
    '  var reaction = sourceNode && sourceNode.reactions && sourceNode.reactions[0];\n' +
    '  if (!reaction) {\n' +
    '    this.performInstantSwitch(sourceElement, targetElement);\n' +
    '    return;\n' +
    '  }\n' +
    '  var duration = reaction.action.transition.duration;\n' +
    '  var easing = this.mapFigmaEasing(reaction.action.transition.easing.type);\n' +
    '  sourceElement.style.transition = "opacity " + duration + "s " + easing;\n' +
    '  targetElement.style.transition = "opacity " + duration + "s " + easing;\n' +
    '  targetElement.style.display = "";\n' +
    '  targetElement.style.opacity = "0";\n' +
    '  var self = this;\n' +
    '  setTimeout(function() {\n' +
    '    sourceElement.style.opacity = "0";\n' +
    '    targetElement.style.opacity = "1";\n' +
    '  }, 16);\n' +
    '  setTimeout(function() {\n' +
    '    self.performInstantSwitch(sourceElement, targetElement);\n' +
    '    self.setupTimeoutReactions(targetId);\n' +
    '  }, duration * 1000);\n' +
    '};\n' +
    '\n' +
    'FigmaAnimationSystem.prototype.mapFigmaEasing = function(figmaEasing) {\n' +
    '  var easingMap = {\n' +
    '    "GENTLE": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",\n' +
    '    "QUICK": "cubic-bezier(0.55, 0.06, 0.68, 0.19)",\n' +
    '    "BOUNCY": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",\n' +
    '    "SLOW": "cubic-bezier(0.23, 1, 0.32, 1)",\n' +
    '    "LINEAR": "linear"\n' +
    '  };\n' +
    '  return easingMap[figmaEasing] || easingMap["GENTLE"];\n' +
    '};\n' +
    '\n' +
    'FigmaAnimationSystem.prototype.performInstantSwitch = function(sourceElement, targetElement) {\n' +
    '  var componentSet = sourceElement.closest("[data-component-set]");\n' +
    '  if (componentSet) {\n' +
    '    var variants = componentSet.querySelectorAll("[data-variant]");\n' +
    '    for (var i = 0; i < variants.length; i++) {\n' +
    '      variants[i].style.display = "none";\n' +
    '    }\n' +
    '  }\n' +
    '  targetElement.style.display = "";\n' +
    '  targetElement.style.opacity = "1";\n' +
    '};\n' +
    '\n' +
    'FigmaAnimationSystem.prototype.setupTimeoutReactions = function(nodeId) {\n' +
    '  var node = this.nodeRegistry[nodeId];\n' +
    '  if (!node || !node.reactions) return;\n' +
    '  var self = this;\n' +
    '  for (var i = 0; i < node.reactions.length; i++) {\n' +
    '    var reaction = node.reactions[i];\n' +
    '    if (reaction.trigger.type === "AFTER_TIMEOUT") {\n' +
    '      console.log("Setting up timeout reaction:", reaction.trigger.timeout + "s delay");\n' +
    '      var timeout = setTimeout(function(destId) {\n' +
    '        return function() {\n' +
    '          self.executeAnimation(nodeId, destId);\n' +
    '        };\n' +
    '      }(reaction.action.destinationId), (reaction.trigger.timeout || 0) * 1000);\n' +
    '      self.timeouts.push(timeout);\n' +
    '    }\n' +
    '  }\n' +
    '};\n' +
    '\n' +
    'document.addEventListener("DOMContentLoaded", function() {\n' +
    '  window.figmaAnimationSystem = new FigmaAnimationSystem();\n' +
    this.generateNodeRegistrations(nodes) +
    this.generateInitialTimeouts(nodes) +
    '  console.log("Animation system ready with ' + nodes.length + ' nodes");\n' +
    '});';
  }

  generateNodeRegistrations(nodes) {
    return nodes.map(function(node) {
      const sanitizedId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      return '\n  var element_' + sanitizedId + ' = document.querySelector(\'[data-figma-id="' + node.id + '"]\');\n' +
             '  if (element_' + sanitizedId + ') {\n' +
             '    window.figmaAnimationSystem.registerElement(\n' +
             '      \'' + node.id + '\',\n' +
             '      element_' + sanitizedId + ',\n' +
             '      ' + JSON.stringify(node) + '\n' +
             '    );\n' +
             '  }';
    }).join('');
  }

  generateInitialTimeouts(nodes) {
    const nodesWithTimeouts = nodes.filter(function(node) {
      return node.reactions && node.reactions.some(function(reaction) {
        return reaction.trigger.type === 'AFTER_TIMEOUT';
      });
    });

    return nodesWithTimeouts.map(function(node) {
      return '\n  window.figmaAnimationSystem.setupTimeoutReactions(\'' + node.id + '\');';
    }).join('');
  }
}

// Data Extractor
class FigmaDataExtractor {
  extractNodes(selection) {
    console.log('Extracting data from', selection.length, 'selected nodes');
    
    if (selection.length === 0) {
      return Promise.reject(new Error('Please select at least one node to export'));
    }

    var extractedNodes = [];
    var self = this;
    
    // Process nodes sequentially 
    function processNode(index) {
      if (index >= selection.length) {
        return Promise.resolve(extractedNodes);
      }
      
      return self.extractNode(selection[index]).then(function(figmaNode) {
        extractedNodes.push(figmaNode);
        return processNode(index + 1);
      });
    }
    
    return processNode(0);
  }

  extractNode(node) {
    var baseNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height
    };

    if ('opacity' in node) {
      baseNode.opacity = node.opacity;
    }

    if ('layoutMode' in node) {
      baseNode.layoutMode = node.layoutMode;
    }
    
    if ('counterAxisAlignItems' in node) {
      baseNode.counterAxisAlignItems = node.counterAxisAlignItems;
    }

    if ('primaryAxisAlignItems' in node) {
      baseNode.primaryAxisAlignItems = node.primaryAxisAlignItems;
    }

    // Extract fills for colors and gradients
    if ('fills' in node && Array.isArray(node.fills)) {
      baseNode.fills = this.extractFills(node.fills);
    }

    // Extract strokes for borders
    if ('strokes' in node && Array.isArray(node.strokes)) {
      baseNode.strokes = this.extractFills(node.strokes); // Same structure as fills
    }

    if ('strokeWeight' in node) {
      baseNode.strokeWeight = node.strokeWeight;
    }

    // Extract text content
    if (node.type === 'TEXT') {
      baseNode.characters = node.characters;
      if ('fontName' in node) {
        baseNode.fontName = node.fontName;
      }
      if ('fontSize' in node) {
        baseNode.fontSize = node.fontSize;
      }
      if ('fontWeight' in node) {
        baseNode.fontWeight = node.fontWeight;
      }
      if ('textAlignHorizontal' in node) {
        baseNode.textAlignHorizontal = node.textAlignHorizontal;
      }
      if ('textAlignVertical' in node) {
        baseNode.textAlignVertical = node.textAlignVertical;
      }
    }

    if ('reactions' in node && Array.isArray(node.reactions)) {
      baseNode.reactions = this.extractReactions(node.reactions);
    }

    var self = this;
    
    // Handle async operations
    var promises = [];
    
    // Extract vector data for SVGs (async)
    if (node.type === 'VECTOR') {
      var svgPromise = node.exportAsync({ format: 'SVG_STRING' }).then(function(svgData) {
        baseNode.svgContent = svgData;
      }).catch(function(error) {
        console.warn('Could not export SVG for vector:', node.name, error);
        // Fallback: try to get vector paths if available
        if ('vectorPaths' in node) {
          baseNode.vectorPaths = node.vectorPaths;
        }
      });
      promises.push(svgPromise);
    }

    // Extract children (async)
    if ('children' in node && Array.isArray(node.children)) {
      baseNode.children = [];
      var childrenPromises = [];
      
      for (var i = 0; i < node.children.length; i++) {
        (function(child) {
          var childPromise = self.extractNode(child).then(function(childNode) {
            baseNode.children.push(childNode);
          });
          childrenPromises.push(childPromise);
        })(node.children[i]);
      }
      
      if (childrenPromises.length > 0) {
        promises.push(Promise.all(childrenPromises));
      }
    }

    if (promises.length > 0) {
      return Promise.all(promises).then(function() {
        return baseNode;
      });
    } else {
      return Promise.resolve(baseNode);
    }
  }

  extractFills(fills) {
    return fills
      .filter(function(fill) { return fill.visible !== false; })
      .map(function(fill) {
        const extractedFill = {
          type: fill.type,
          opacity: fill.opacity || 1
        };

        if (fill.type === 'SOLID') {
          extractedFill.color = {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b
          };
        } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
          extractedFill.gradientStops = fill.gradientStops.map(stop => ({
            position: stop.position,
            color: {
              r: stop.color.r,
              g: stop.color.g,
              b: stop.color.b
            }
          }));
          
          if (fill.gradientTransform) {
            extractedFill.gradientTransform = fill.gradientTransform;
          }
        }

        return extractedFill;
      });
  }

  extractReactions(reactions) {
    return reactions
      .filter(reaction => reaction.action && reaction.action.type === 'NODE')
      .map(reaction => {
        const figmaReaction = {
          trigger: {
            type: reaction.trigger.type
          },
          action: {
            type: 'NODE',
            destinationId: reaction.action.destinationId || '',
            navigation: 'CHANGE_TO',
            transition: {
              type: reaction.action.transition && reaction.action.transition.type || 'SMART_ANIMATE',
              easing: {
                type: reaction.action.transition && reaction.action.transition.easing && reaction.action.transition.easing.type || 'GENTLE'
              },
              duration: reaction.action.transition && reaction.action.transition.duration || 0.3
            }
          }
        };

        if (reaction.trigger.type === 'AFTER_TIMEOUT' && 'timeout' in reaction.trigger) {
          figmaReaction.trigger.timeout = reaction.trigger.timeout;
        }

        return figmaReaction;
      });
  }
}

// Plugin main logic
// Inline UI HTML for better compatibility
var uiHTML = '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <style>' +
'    body { font-family: sans-serif; padding: 16px; margin: 0; }' +
'    .button { width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }' +
'    .button.primary { background: #0066cc; color: white; border-color: #0066cc; }' +
'    .button:hover { background: #f8f8f8; }' +
'    .button.primary:hover { background: #0052a3; }' +
'    .status { padding: 8px; margin-bottom: 8px; border-radius: 4px; font-size: 12px; display: none; }' +
'    .status.success { background: #e8f5e8; color: #2d5a2d; }' +
'    .status.error { background: #ffe8e8; color: #5a2d2d; }' +
'    .section { margin-bottom: 16px; }' +
'    .section-title { font-weight: bold; margin-bottom: 8px; }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div id="status" class="status"></div>' +
'  <div class="section">' +
'    <div class="section-title">Figma Animation Export</div>' +
'    <button id="analyze-btn" class="button">Analyze Selection</button>' +
'    <button id="export-btn" class="button primary">Export to HTML</button>' +
'    <button id="export-file-btn" class="button">Export as File</button>' +
'  </div>' +
'  <script>' +
'    function showStatus(message, type) {' +
'      var statusEl = document.getElementById("status");' +
'      statusEl.textContent = message;' +
'      statusEl.className = "status " + type;' +
'      statusEl.style.display = "block";' +
'    }' +
'    ' +
'    document.getElementById("analyze-btn").addEventListener("click", function() {' +
'      parent.postMessage({ pluginMessage: { type: "analyze-selection" } }, "*");' +
'    });' +
'    ' +
'    document.getElementById("export-btn").addEventListener("click", function() {' +
'      parent.postMessage({ pluginMessage: { type: "export-html" } }, "*");' +
'    });' +
'    ' +
'    document.getElementById("export-file-btn").addEventListener("click", function() {' +
'      parent.postMessage({ pluginMessage: { type: "export-file" } }, "*");' +
'    });' +
'    ' +
'    window.onmessage = function(event) {' +
'      var msg = event.data.pluginMessage;' +
'      if (!msg) return;' +
'      ' +
'      if (msg.type === "plugin-ready") {' +
'        showStatus("Plugin ready - select components to export", "success");' +
'      } else if (msg.type === "html-generated" || msg.type === "file-exported") {' +
'        if (msg.success) {' +
'          if (msg.type === "file-exported") {' +
'            var blob = new Blob([msg.html], { type: "text/html" });' +
'            var url = URL.createObjectURL(blob);' +
'            var a = document.createElement("a");' +
'            a.href = url;' +
'            a.download = msg.filename || "figma-export.html";' +
'            document.body.appendChild(a);' +
'            a.click();' +
'            document.body.removeChild(a);' +
'            URL.revokeObjectURL(url);' +
'            showStatus("File exported: " + a.download, "success");' +
'          } else {' +
'            showStatus("HTML generated successfully!", "success");' +
'          }' +
'        } else {' +
'          showStatus("Export failed: " + msg.error, "error");' +
'        }' +
'      } else if (msg.type === "error") {' +
'        showStatus("Error: " + msg.message, "error");' +
'      }' +
'    };' +
'  </script>' +
'</body>' +
'</html>';

figma.showUI(uiHTML, { width: 400, height: 500 });

figma.ui.onmessage = function(msg) {
  try {
    switch (msg.type) {
      case 'export-html':
        handleExportHTML();
        break;
      
      case 'export-file':
        handleExportFile();
        break;
      
      case 'analyze-selection':
        handleAnalyzeSelection();
        break;
        
      case 'close-plugin':
        figma.closePlugin();
        break;
        
      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    });
  }
};

function handleExportHTML() {
  var selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one component or frame to export',
      success: false
    });
    return;
  }

  console.log('Starting HTML export for', selection.length, 'selected nodes');

  var extractor = new FigmaDataExtractor();
  extractor.extractNodes(selection).then(function(nodes) {
    console.log('Extracted nodes:', nodes);

    var generator = new HTMLGenerator();
    var html = generator.generateHTML(nodes);
    
    figma.ui.postMessage({
      type: 'html-generated',
      html: html,
      metadata: {
        nodeCount: nodes.length
      },
      success: true
    });
    
    console.log('HTML export completed successfully');
  }).catch(function(error) {
    figma.ui.postMessage({
      type: 'error',
      message: error.message,
      success: false
    });
  });
}

function handleExportFile() {
  var selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one component or frame to export',
      success: false
    });
    return;
  }

  console.log('Starting file export for', selection.length, 'selected nodes');

  var extractor = new FigmaDataExtractor();
  extractor.extractNodes(selection).then(function(nodes) {
    console.log('Extracted nodes with fills and SVGs:', nodes);

    var generator = new HTMLGenerator();
    var html = generator.generateHTML(nodes);
    
    // Generate filename based on selection
    var firstNode = nodes[0];
    var filename = firstNode.name.replace(/[^a-zA-Z0-9]/g, '-') + '-animation.html';
    
    figma.ui.postMessage({
      type: 'file-exported',
      html: html,
      filename: filename,
      metadata: {
        nodeCount: nodes.length
      },
      success: true
    });
    
    console.log('File export completed successfully');
  }).catch(function(error) {
    figma.ui.postMessage({
      type: 'error',
      message: error.message,
      success: false
    });
  });
}

function handleAnalyzeSelection() {
  var selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'analysis-result',
      message: 'No nodes selected',
      data: null,
      success: false
    });
    return;
  }

  var extractor = new FigmaDataExtractor();
  extractor.extractNodes(selection).then(function(nodes) {
    var analysis = {
      totalNodes: nodes.length,
      nodeTypes: {},
      componentSets: 0,
      components: 0,
      nodesWithReactions: 0,
      timeoutReactions: 0
    };

    nodes.forEach(function(node) {
      analysis.nodeTypes[node.type] = (analysis.nodeTypes[node.type] || 0) + 1;
      
      if (node.type === 'COMPONENT_SET') {
        analysis.componentSets++;
      } else if (node.type === 'COMPONENT') {
        analysis.components++;
      }
      
      if (node.reactions && node.reactions.length > 0) {
        analysis.nodesWithReactions++;
        
        var timeoutReactions = node.reactions.filter(function(r) { return r.trigger.type === 'AFTER_TIMEOUT'; });
        analysis.timeoutReactions += timeoutReactions.length;
      }
    });

    figma.ui.postMessage({
      type: 'analysis-result',
      message: 'Analysis completed',
      data: analysis,
      success: true
    });
  }).catch(function(error) {
    figma.ui.postMessage({
      type: 'error',
      message: error.message,
      success: false
    });
  });
}

console.log('Figma Animation Plugin initialized');
figma.ui.postMessage({
  type: 'plugin-ready',
  message: 'Plugin loaded successfully',
  success: true
});
