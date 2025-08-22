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
      const variantCSS = this.generateVariantCSS(resolvedInstances, nodes);
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
  private generateVariantCSS(resolvedInstances: any[], allNodes: FigmaNode[]): string {
    let css = '';
    
    resolvedInstances.forEach(instance => {
      const { instance: instanceNode, variants, activeVariant } = instance;
      
      // Calculate absolute position by traversing up the parent chain
      const absolutePosition = this.calculateAbsolutePosition(instanceNode, allNodes);
      
      // Generate CSS for the variant container (acts as the instance sizing context)
      css += `\n/* Variant container for ${instanceNode.name} */\n`;
      css += `.variant-container[data-instance-id="${instanceNode.id}"] {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${absolutePosition.x}px;\n`;
      css += `  top: ${absolutePosition.y}px;\n`;
      css += `  width: ${instanceNode.width}px;\n`;
      css += `  height: ${instanceNode.height}px;\n`;
      css += `  overflow: visible;\n`;
      css += `}\n`;
      
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
        css += `  left: ${variant.x - instanceNode.x}px;\n`; // Position relative to instance
        css += `  top: ${variant.y - instanceNode.y}px;\n`;  // Position relative to instance
        css += `}\n`;
      });
    });
    
    return css;
  }

  // Generate CSS for all elements within a variant (recursively)
  private generateVariantElementCSS(variant: FigmaNode): string {
    let css = '';
    
    // Generate CSS for all child elements recursively
    const generateCSSForNode = (node: FigmaNode, parent?: FigmaNode): void => {
      // Generate scoped CSS for this node within the variant context
      const scopedCSS = this.generateScopedVariantCSS(node, variant, false, parent);
      css += scopedCSS + '\n\n';
      
      // Recursively generate CSS for children
      if (node.children) {
        node.children.forEach(child => generateCSSForNode(child, node));
      }
    };
    
    generateCSSForNode(variant);
    return css;
  }

  // Generate scoped CSS for an element within a specific variant
  private generateScopedVariantCSS(node: FigmaNode, variant: FigmaNode, isRoot: boolean = false, parent?: FigmaNode): string {
    // For the component itself, use direct selector
    // For child elements, use scoped selector to avoid conflicts
    let selector: string;
    
    if (node.id === variant.id) {
      // Component itself - use direct selector
      selector = `[data-figma-id="${node.id}"]`;
    } else {
      // Child element - use scoped selector to avoid conflicts with other variants
      const variantSelector = `[data-figma-id="${variant.id}"]`;
      const nodeSelector = `[data-figma-id="${node.id}"]`;
      selector = `${variantSelector} ${nodeSelector}`;
    }
    
    // Generate properties using the style generator
    const properties = this.styleGenerator.generateCSSProperties(node, isRoot, parent);
    
    return `${selector} {\n${properties}\n}`;
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

  // Calculate absolute position by traversing up the parent chain
  private calculateAbsolutePosition(instanceNode: FigmaNode, allNodes: FigmaNode[]): { x: number; y: number } {
    let absoluteX = instanceNode.x;
    let absoluteY = instanceNode.y;
    
    // Find the parent chain by looking for nodes that contain this instance
    const findParentChain = (targetId: string, nodes: FigmaNode[], currentPath: FigmaNode[] = []): FigmaNode[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return currentPath;
        }
        
        if (node.children) {
          const found = findParentChain(targetId, node.children, [...currentPath, node]);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };
    
    const parentChain = findParentChain(instanceNode.id, allNodes);
    
    if (parentChain) {
      // Add up all parent positions
      for (const parent of parentChain) {
        absoluteX += parent.x;
        absoluteY += parent.y;
      }
    }
    
    return { x: absoluteX, y: absoluteY };
  }
}


