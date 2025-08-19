import { FigmaNode, FigmaFill } from '../core/types';

export class StyleGenerator {
  generateStyles(node: FigmaNode, isRoot: boolean = false): string {
    const selector = `[data-figma-id="${node.id}"]`;
    const properties = this.generateCSSProperties(node, isRoot);
    
    let css = `${selector} {\n${properties}\n}`;
    
    // Generate styles for children
    if (node.children) {
      const childStyles = node.children
        .map(child => this.generateStyles(child, false))
        .join('\n\n');
      css += '\n\n' + childStyles;
    }
    
    return css;
  }

  private generateCSSProperties(node: FigmaNode, isRoot: boolean = false): string {
    const properties: string[] = [];

    // Position and dimensions - normalize coordinates for browser viewport
    if (isRoot) {
      // Root elements should be positioned at 0,0
      properties.push(`position: absolute;`);
      properties.push(`left: 0px;`);
      properties.push(`top: 0px;`);
      properties.push(`width: ${node.width}px;`);
      properties.push(`height: ${node.height}px;`);
    } else {
      // Child elements use relative positioning within their parent
      properties.push(`position: absolute;`);
      properties.push(`left: ${node.x}px;`);
      properties.push(`top: ${node.y}px;`);
      properties.push(`width: ${node.width}px;`);
      properties.push(`height: ${node.height}px;`);
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      properties.push(`opacity: ${node.opacity};`);
    }

    // Layout mode (for flexbox)
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      properties.push(`display: flex;`);
      
      if (node.layoutMode === 'HORIZONTAL') {
        properties.push(`flex-direction: row;`);
      } else if (node.layoutMode === 'VERTICAL') {
        properties.push(`flex-direction: column;`);
      }

      // Alignment
      if (node.counterAxisAlignItems) {
        const alignMap = {
          'MIN': 'flex-start',
          'CENTER': 'center',
          'MAX': 'flex-end'
        };
        properties.push(`align-items: ${alignMap[node.counterAxisAlignItems]};`);
      }

      if (node.primaryAxisAlignItems) {
        const justifyMap = {
          'MIN': 'flex-start',
          'CENTER': 'center',
          'MAX': 'flex-end'
        };
        properties.push(`justify-content: ${justifyMap[node.primaryAxisAlignItems]};`);
      }
    }

    // Background fills
    if (node.fills && node.fills.length > 0) {
      const backgroundCSS = this.generateBackgroundCSS(node.fills);
      if (backgroundCSS) {
        properties.push(backgroundCSS);
      }
    }

    // Corner radius
    if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
      properties.push(`border-radius: ${node.cornerRadius}px;`);
    }

    // Component-specific styles
    if (node.type === 'COMPONENT_SET') {
      properties.push(`position: relative;`);
    }

    if (node.type === 'COMPONENT') {
      // Show the first variant by default, hide others
      // This will be overridden by the animation system
      properties.push(`display: block;`);
    }

    // Text-specific styles
    if (node.type === 'TEXT') {
      properties.push(`font-family: system-ui, -apple-system, sans-serif;`);
      properties.push(`display: flex;`);
      properties.push(`align-items: center;`);
      properties.push(`justify-content: center;`);
    }

    return properties.map(prop => `  ${prop}`).join('\n');
  }

  private generateBackgroundCSS(fills: FigmaFill[]): string | null {
    const solidFill = fills.find(fill => fill.type === 'SOLID' && fill.color);
    
    if (solidFill?.color) {
      const { r, g, b } = solidFill.color;
      const alpha = solidFill.opacity || 1;
      return `background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha});`;
    }

    // TODO: Handle gradients
    return null;
  }
}
