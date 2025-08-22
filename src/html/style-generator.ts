import { FigmaNode, FigmaFill } from '../core/types';
import { PositionCalculator } from '../utils/position-calculator';

export class StyleGenerator {
  generateStyles(node: FigmaNode, isRoot: boolean = false, parent?: FigmaNode): string {
    const selector = `[data-figma-id="${node.id}"]`;
    const properties = this.generateCSSProperties(node, isRoot, parent);
    
    let css = `${selector} {\n${properties}\n}`;
    
    // Generate styles for children
    if (node.children) {
      const childStyles = node.children
        .map(child => this.generateStyles(child, false, node))
        .join('\n\n');
      css += '\n\n' + childStyles;
    }
    
    return css;
  }

  generateCSSProperties(node: FigmaNode, isRoot: boolean = false, parent?: FigmaNode): string {
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
      // Determine positioning based on parent's layout mode
      if (parent && this.parentHasAutoLayout(parent)) {
        // Parent has auto layout - child should use relative positioning to flow within flex container
        properties.push(`position: relative;`);
        
        // In flex layout, we don't need explicit left/top positioning
        // The flex container handles positioning via align-items, justify-content, etc.
      } else {
        // Parent has no auto layout - child uses absolute positioning
        const adjustedPosition = this.adjustLayoutDrivenPosition(node, parent);
        
        properties.push(`position: absolute;`);
        properties.push(`left: ${adjustedPosition.x}px;`);
        properties.push(`top: ${adjustedPosition.y}px;`);
      }
      
      // Only set width/height here if not using special sizing (FILL/HUG will be set later)
      if (!node.layoutSizingHorizontal || node.layoutSizingHorizontal === 'FIXED') {
        properties.push(`width: ${node.width}px;`);
      }
      if (!node.layoutSizingVertical || node.layoutSizingVertical === 'FIXED') {
        properties.push(`height: ${node.height}px;`);
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      properties.push(`opacity: ${node.opacity};`);
    }

    // Layout mode (for flexbox)
    if (this.nodeHasAutoLayout(node)) {
      properties.push(`display: flex;`);
      
      // Determine flex direction - if layoutMode is explicit, use it
      // Otherwise, infer from the presence of alignment properties
      if (node.layoutMode === 'HORIZONTAL') {
        properties.push(`flex-direction: row;`);
      } else if (node.layoutMode === 'VERTICAL') {
        properties.push(`flex-direction: column;`);
      } else if (node.layoutMode === 'NONE' && this.hasAutoLayoutProperties(node)) {
        // Infer direction based on content or default to row
        // For now, default to row for components with auto layout properties
        properties.push(`flex-direction: row;`);
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

      // Item spacing (gap)
      if (node.itemSpacing !== undefined && node.itemSpacing > 0) {
        properties.push(`gap: ${node.itemSpacing}px;`);
      }
    }

    // Sizing properties (FILL/HUG/FIXED)
    // For components, always use explicit dimensions regardless of sizing properties
    if (node.type === 'COMPONENT') {
      // Components need explicit width and height to match their Figma dimensions
      if (node.width && node.height) {
        properties.push(`width: ${node.width}px;`);
        properties.push(`height: ${node.height}px;`);
      }
    } else {
      // Regular sizing logic for non-component nodes
      if (node.layoutSizingHorizontal) {
        switch (node.layoutSizingHorizontal) {
          case 'FILL':
            properties.push(`width: 100%;`);
            break;
          case 'HUG':
            // Check if this node has absolutely positioned children that would break fit-content
            if (this.hasAbsolutelyPositionedChildren(node)) {
              // Use the child's width as the parent's fixed width
              const childWidth = this.getChildWidthForHugSizing(node);
              if (childWidth > 0) {
                properties.push(`width: ${childWidth}px;`);
              } else {
                properties.push(`width: fit-content;`);
              }
            } else {
              properties.push(`width: fit-content;`);
            }
            break;
          case 'FIXED':
            // Width is already set above, no additional CSS needed
            break;
        }
      }

      if (node.layoutSizingVertical) {
        switch (node.layoutSizingVertical) {
          case 'FILL':
            properties.push(`height: 100%;`);
            break;
          case 'HUG':
            properties.push(`height: fit-content;`);
            break;
          case 'FIXED':
            // Height is already set above, no additional CSS needed
            break;
        }
      }
    }

    // Background fills (exclude SVG nodes and TEXT nodes - they handle fills internally)
    if (node.fills && node.fills.length > 0 && !this.isSVGNode(node) && node.type !== 'TEXT') {
      const backgroundCSS = this.generateBackgroundCSS(node.fills);
      if (backgroundCSS) {
        properties.push(backgroundCSS);
      }
    }

    // Corner radius
    if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
      properties.push(`border-radius: ${node.cornerRadius}px;`);
    }

    // Overflow properties
    if (node.overflow) {
      const overflowMap = {
        'VISIBLE': 'visible',
        'HIDDEN': 'hidden',
        'SCROLL': 'scroll'
      };
      properties.push(`overflow: ${overflowMap[node.overflow]};`);
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
      const textStyles = this.generateTextStyles(node);
      properties.push(...textStyles);
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

  private adjustLayoutDrivenPosition(node: FigmaNode, parent?: FigmaNode): { x: number; y: number } {
    // Use the PositionCalculator for generic position adjustments
    const adjustment = PositionCalculator.calculateAdjustedPosition(node, parent);
    return { x: adjustment.x, y: adjustment.y };
  }

  private hasAbsolutelyPositionedChildren(node: FigmaNode): boolean {
    // Check if this node has children that are positioned for animation
    // A simple heuristic: if the node has HUG sizing and has exactly one child with FIXED sizing,
    // that child's width should determine the parent's width
    if (node.layoutSizingHorizontal === 'HUG' && node.children && node.children.length === 1) {
      const child = node.children[0];
      return child.layoutSizingHorizontal === 'FIXED';
    }
    return false;
  }

  private getChildWidthForHugSizing(node: FigmaNode): number {
    if (node.children && node.children.length === 1) {
      const child = node.children[0];
      return child.width || 0;
    }
    return 0;
  }

  private isSVGNode(node: FigmaNode): boolean {
    return node.type === 'VECTOR' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE';
  }

  private generateTextStyles(node: FigmaNode): string[] {
    const textStyles: string[] = [];

    // Font size
    if (node.fontSize) {
      textStyles.push(`font-size: ${node.fontSize}px;`);
    }

    // Font family - use fontName like the reference project
    if (node.fontName && typeof node.fontName === 'object' && node.fontName.family) {
      const figmaFamily = String(node.fontName.family);
      // Use exact Figma font names with fallback
      textStyles.push(`font-family: "${figmaFamily}", sans-serif;`);
    } else if (node.fontFamily) {
      textStyles.push(`font-family: "${node.fontFamily}", sans-serif;`);
    } else {
      // Default to CircularXX TT for consistency with reference project
      textStyles.push(`font-family: "CircularXX TT", sans-serif;`);
    }

    // Font weight - convert Figma font style to CSS font weight
    if (node.fontName && typeof node.fontName === 'object' && node.fontName.style) {
      const figmaStyle = String(node.fontName.style);
      let cssWeight = '400'; // Default
      
      if (figmaStyle.includes('Bold')) cssWeight = '700';
      else if (figmaStyle.includes('Medium')) cssWeight = '500';
      else if (figmaStyle.includes('Light')) cssWeight = '300';
      else if (figmaStyle.includes('Thin')) cssWeight = '100';
      else if (figmaStyle.includes('Black')) cssWeight = '900';
      else if (figmaStyle.includes('Book')) cssWeight = '450';
      
      textStyles.push(`font-weight: ${cssWeight};`);
    } else if (node.fontWeight) {
      textStyles.push(`font-weight: ${node.fontWeight};`);
    }

    // Text alignment
    if (node.textAlignHorizontal) {
      textStyles.push(`text-align: ${node.textAlignHorizontal.toLowerCase()};`);
    }

    // Letter spacing
    if (node.letterSpacing) {
      if (typeof node.letterSpacing === 'object' && node.letterSpacing.value) {
        const unit = node.letterSpacing.unit === 'PERCENT' ? '%' : 'px';
        textStyles.push(`letter-spacing: ${node.letterSpacing.value}${unit};`);
      } else if (typeof node.letterSpacing === 'number') {
        textStyles.push(`letter-spacing: ${node.letterSpacing}px;`);
      }
    }

    // Line height
    if (node.lineHeight) {
      if (typeof node.lineHeight === 'object' && node.lineHeight.value) {
        const unit = (node.lineHeight as any).unit;
        if (unit === 'AUTO' || unit === 'auto') {
          textStyles.push(`line-height: normal;`);
        } else {
          // Figma line height is percentage
          textStyles.push(`line-height: ${node.lineHeight.value}%;`);
        }
      } else if (typeof node.lineHeight === 'number') {
        textStyles.push(`line-height: ${node.lineHeight}%;`);
      } else if (typeof node.lineHeight === 'string' && (node.lineHeight as string).toLowerCase() === 'auto') {
        textStyles.push(`line-height: normal;`);
      }
    }

    // Text color from fills
    if (node.fills && node.fills.length > 0) {
      const textColor = this.generateTextColor(node.fills);
      if (textColor) {
        textStyles.push(textColor);
      }
    }

    // Default text styling for better rendering
    textStyles.push(`margin: 0;`); // Remove default p tag margins
    textStyles.push(`padding: 0;`); // Remove default p tag padding
    textStyles.push(`background: none;`); // Ensure no background color on text elements
    
    // Ensure text elements have proper dimensions and visibility
    if (node.width && node.height) {
      textStyles.push(`width: ${node.width}px;`);
      textStyles.push(`height: ${node.height}px;`);
      textStyles.push(`overflow: hidden;`); // Prevent text overflow
    }
    
    // Ensure text is visible even without explicit color
    if (!textStyles.some(style => style.startsWith('color:'))) {
      textStyles.push(`color: rgba(0, 0, 0, 1);`); // Default black text
    }
    
    // Ensure text has proper line height for visibility
    if (!textStyles.some(style => style.startsWith('line-height:'))) {
      textStyles.push(`line-height: 1.2;`); // Default line height
    }
    
    // Ensure text has minimum font size for visibility
    if (!textStyles.some(style => style.startsWith('font-size:'))) {
      textStyles.push(`font-size: 16px;`); // Default font size
    }
    
    // Ensure text has minimum font weight for visibility
    if (!textStyles.some(style => style.startsWith('font-weight:'))) {
      textStyles.push(`font-weight: 400;`); // Default font weight
    }
    
    // Ensure text has font family for visibility
    if (!textStyles.some(style => style.startsWith('font-family:'))) {
      textStyles.push(`font-family: "CircularXX TT", sans-serif;`); // Default font family
    }
    
    return textStyles;
  }

  private generateTextColor(fills: FigmaFill[]): string | null {
    const solidFill = fills.find(fill => fill.type === 'SOLID' && fill.color);
    
    if (solidFill?.color) {
      const { r, g, b } = solidFill.color;
      const alpha = solidFill.opacity || 1;
      return `color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha});`;
    }

    return null;
  }

  /**
   * Check if a parent node has auto layout, including cases where layoutMode is NONE
   * but auto layout properties are present (indicating incorrect data)
   */
  private parentHasAutoLayout(parent: FigmaNode): boolean {
    // Only consider explicit layout mode as auto layout
    // Auto layout properties alone don't make a node a flex container
    return !!(parent.layoutMode && parent.layoutMode !== 'NONE');
  }

  /**
   * Check if a node has auto layout, including cases where layoutMode is NONE
   * but auto layout properties are present (indicating incorrect data)
   */
  private nodeHasAutoLayout(node: FigmaNode): boolean {
    // Only consider explicit layout mode as auto layout
    // Auto layout properties alone don't make a node a flex container
    return !!(node.layoutMode && node.layoutMode !== 'NONE');
  }

  /**
   * Check if a node has auto layout properties
   */
  private hasAutoLayoutProperties(node: FigmaNode): boolean {
    return node.counterAxisAlignItems !== undefined ||
           node.primaryAxisAlignItems !== undefined ||
           node.itemSpacing !== undefined ||
           node.paddingLeft !== undefined ||
           node.paddingRight !== undefined ||
           node.paddingTop !== undefined ||
           node.paddingBottom !== undefined;
  }
}
