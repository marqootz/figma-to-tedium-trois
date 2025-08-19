import { FigmaNode } from '../core/types';
import { ElementBuilder } from './element-builder';
import { StyleGenerator } from './style-generator';
import { AnimationHandler } from './animation-handler';

export class HTMLGenerator {
  private elementBuilder = new ElementBuilder();
  private styleGenerator = new StyleGenerator();
  private animationHandler = new AnimationHandler();

  generateHTML(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    const css = this.generateCSS(nodes, resolvedInstances);
    const bodyHTML = this.generateBodyHTML(nodes, resolvedInstances);
    const javascript = this.generateJavaScript(nodes, resolvedInstances);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Export</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
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
    let html = nodes.map(node => this.elementBuilder.buildElement(node)).join('\n');
    
    // Add HTML for all variants if we have resolved instances
    if (resolvedInstances) {
      const variantHTML = this.generateVariantHTML(resolvedInstances);
      html += '\n' + variantHTML;
    }
    
    return html;
  }

  private generateJavaScript(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    return this.animationHandler.generateAnimationCode(nodes, resolvedInstances);
  }

  // Generate CSS for all variants in the shadow variant system
  private generateVariantCSS(resolvedInstances: any[]): string {
    let css = '';
    
    resolvedInstances.forEach(instance => {
      const { variants, activeVariant } = instance;
      
      // Generate CSS for each variant
      variants.forEach((variant: FigmaNode) => {
        const variantCSS = this.styleGenerator.generateStyles(variant, false);
        css += '\n\n' + variantCSS;
        
        // Add variant-specific visibility rules
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


