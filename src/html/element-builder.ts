import { FigmaNode } from '../core/types';
import { convertVectorToSVG, convertRectangleToSVG, convertEllipseToSVG } from '../utils/svg-converter';

export class ElementBuilder {
  buildElement(node: FigmaNode): string {
    // Handle SVG nodes differently
    if (node.type === 'VECTOR') {
      const svg = convertVectorToSVG(node);
      const width = node.width || 0;
      const height = node.height || 0;
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" data-figma-id="${node.id}" data-figma-name="${node.name}" data-figma-type="${node.type}">${svg}</svg>`;
    }

    if (node.type === 'RECTANGLE') {
      const svg = convertRectangleToSVG(node);
      const width = node.width || 0;
      const height = node.height || 0;
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" data-figma-id="${node.id}" data-figma-name="${node.name}" data-figma-type="${node.type}">${svg}</svg>`;
    }

    if (node.type === 'ELLIPSE') {
      const svg = convertEllipseToSVG(node);
      const width = node.width || 0;
      const height = node.height || 0;
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" data-figma-id="${node.id}" data-figma-name="${node.name}" data-figma-type="${node.type}">${svg}</svg>`;
    }

    const attributes = this.generateAttributes(node);
    const content = this.generateContent(node);
    const tag = this.getHTMLTag(node);

    return `<${tag}${attributes}>${content}</${tag}>`;
  }

  private generateAttributes(node: FigmaNode): string {
    const attrs = [
      `data-figma-id="${node.id}"`,
      `data-figma-name="${node.name}"`,
      `data-figma-type="${node.type}"`
    ];

    // Add component set and variant markers
    if (node.type === 'COMPONENT_SET') {
      attrs.push('data-component-set="true"');
    }

    if (node.type === 'COMPONENT') {
      attrs.push('data-variant="true"');
    }

    // Add layout attributes
    if (node.layoutMode) {
      attrs.push(`data-layout-mode="${node.layoutMode}"`);
    }

    // Add reaction attributes
    if (node.reactions && node.reactions.length > 0) {
      attrs.push(`data-reactions='${JSON.stringify(node.reactions)}'`);
    }

    return ' ' + attrs.join(' ');
  }

  private generateContent(node: FigmaNode): string {
    if (node.children && node.children.length > 0) {
      return node.children.map(child => this.buildElement(child)).join('\n');
    }

    // Handle text content
    if (node.type === 'TEXT') {
      // Use the actual text content from characters property
      return node.characters || node.name || '';
    }

    return '';
  }

  private getHTMLTag(node: FigmaNode): string {
    switch (node.type) {
      case 'COMPONENT_SET':
      case 'COMPONENT':
      case 'INSTANCE':
      case 'FRAME':
        return 'div';
      case 'TEXT':
        // Use p tag for longer text, span for short labels
        const textLength = node.characters ? node.characters.length : 0;
        return textLength > 50 ? 'p' : 'span';
      case 'VECTOR':
      case 'RECTANGLE':
      case 'ELLIPSE':
        return 'svg';
      default:
        return 'div';
    }
  }
}


