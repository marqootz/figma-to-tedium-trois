import { FigmaNode } from '../core/types';
import { ElementBuilder } from './element-builder';
import { StyleGenerator } from './style-generator';
import { AnimationHandler } from './animation-handler';
import { getEmbeddedFontStyles, analyzeRequiredFonts, generateFontPreloadLinks } from '../utils/font-loader';

export class HTMLGenerator {
  private elementBuilder = new ElementBuilder();
  private styleGenerator = new StyleGenerator();
  private animationHandler = new AnimationHandler();

  generateHTML(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    const css = this.generateCSS(nodes, resolvedInstances);
    const bodyHTML = this.generateBodyHTML(nodes, resolvedInstances);
    const javascript = this.generateJavaScript(nodes, resolvedInstances);
    
    // Analyze required fonts for preloading
    const allNodes = [...nodes];
    if (resolvedInstances) {
      resolvedInstances.forEach(instance => {
        allNodes.push(...instance.variants);
      });
    }
    const requiredFonts = analyzeRequiredFonts(allNodes);
    const fontPreloadLinks = generateFontPreloadLinks(requiredFonts);
    const fontStyles = getEmbeddedFontStyles();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Export</title>
  ${fontPreloadLinks ? `  ${fontPreloadLinks}\n` : ''}  <style>
    /* Font definitions */
${fontStyles}
    
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "CircularXX TT", system-ui, -apple-system, sans-serif;
      background-color: #f5f5f5;
      overflow: hidden;
      margin: 0;
    }
    
    /* Component styles */
${css}
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    ${javascript}
  </script>
</body>
</html>`;
  }

  private generateCSS(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    let css = nodes.map(node => this.styleGenerator.generateStyles(node, true)).join('\n\n');
    
    // Add CSS for all variants if we have resolved instances
    if (resolvedInstances) {
      const variantCSS = this.generateVariantCSS(resolvedInstances);
      css += '\n\n' + variantCSS;
    }
    
    return css;
  }

  private generateBodyHTML(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    // Add test element to verify latest plugin code is being used
    const testElement = this.generateTestElement();
    
    let html = testElement + '\n' + nodes.map(node => this.elementBuilder.buildElement(node)).join('\n');
    
    // Add HTML for all variants if we have resolved instances
    if (resolvedInstances) {
      const variantHTML = this.generateVariantHTML(resolvedInstances);
      html += '\n' + variantHTML;
    }
    
    return html;
  }

  private generateTestElement(): string {
    const timestamp = new Date().toISOString();
    const version = '1.0.0';
    const buildTime = new Date().toLocaleString();
    
    return `<!-- PLUGIN TEST ELEMENT - VERIFY LATEST CODE -->
<div id="plugin-test-element" style="
  position: fixed;
  top: 10px;
  right: 10px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  border: 2px solid #fff;
">
  <div style="font-weight: bold; margin-bottom: 4px;">✅ Latest Plugin Code</div>
  <div style="font-size: 10px; opacity: 0.9;">Version: ${version}</div>
  <div style="font-size: 10px; opacity: 0.9;">Built: ${buildTime}</div>
  <div style="font-size: 10px; opacity: 0.9;">Exported: ${timestamp}</div>
</div>`;
  }

  private generateJavaScript(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    return this.animationHandler.generateAnimationCode(nodes, resolvedInstances);
  }

  // Generate CSS for all variants in the shadow variant system
  private generateVariantCSS(resolvedInstances: any[]): string {
    let css = '';
    
    resolvedInstances.forEach(instance => {
      const { variants, activeVariant } = instance;
      
      // Generate CSS for each variant and its children
      variants.forEach((variant: FigmaNode) => {
        // Generate CSS for all child elements within the variant
        const variantCSS = this.generateVariantElementCSS(variant);
        css += '\n\n' + variantCSS;
        
        // Add variant-specific visibility rules for the main variant container
        const isActive = variant.id === activeVariant.id;
        css += `\n[data-figma-id="${variant.id}"] {\n`;
        css += `  display: ${isActive ? 'block' : 'none'};\n`;
        css += `  position: absolute;\n`;
        css += `  left: 0;\n`;
        css += `  top: 0;\n`;
        css += `}\n`;
      });
    });
    
    return css;
  }

  // Generate CSS for all elements within a variant (recursively)
  private generateVariantElementCSS(variant: FigmaNode): string {
    let css = '';
    
    // Generate CSS for all child elements recursively
    const generateCSSForNode = (node: FigmaNode): void => {
      // Skip the main variant container to avoid duplicates
      if (node.id === variant.id) {
        // Only generate CSS for children of the variant container
        if (node.children) {
          node.children.forEach(child => generateCSSForNode(child));
        }
        return;
      }
      
      // Generate CSS for this node
      css += this.styleGenerator.generateStyles(node, false) + '\n\n';
      
      // Recursively generate CSS for children
      if (node.children) {
        node.children.forEach(child => generateCSSForNode(child));
      }
    };
    
    generateCSSForNode(variant);
    return css;
  }

  // Generate HTML for all variants in the shadow variant system
  private generateVariantHTML(resolvedInstances: any[]): string {
    let html = '';
    
    resolvedInstances.forEach(instance => {
      const { instance: instanceNode, variants } = instance;
      
      // Create a container for all variants
      html += `\n<!-- Variants for ${instanceNode.name} -->\n`;
      html += `<div class="variant-container" data-instance-id="${instanceNode.id}">\n`;
      
      // Generate HTML for each variant
      variants.forEach((variant: FigmaNode) => {
        const variantHTML = this.elementBuilder.buildElement(variant);
        html += variantHTML + '\n';
      });
      
      html += `</div>\n`;
    });
    
    return html;
  }
}


