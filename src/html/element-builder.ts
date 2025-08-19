import { FigmaNode } from '../core/types';

export class ElementBuilder {
  buildElement(node: FigmaNode): string {
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
    if (node.children) {
      return node.children.map(child => this.buildElement(child)).join('\n');
    }

    // Handle text content, vectors, etc.
    if (node.type === 'TEXT') {
      // Extract text content from node
      return node.name; // Simplified
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
        return 'span';
      default:
        return 'div';
    }
  }
}


