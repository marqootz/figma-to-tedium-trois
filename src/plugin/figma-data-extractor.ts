import { FigmaNode, FigmaReaction, FigmaFill, FigmaColor } from '../core/types';

export class FigmaDataExtractor {
  async extractNodes(selection: readonly SceneNode[]): Promise<FigmaNode[]> {
    console.log('Extracting data from', selection.length, 'selected nodes');
    
    if (selection.length === 0) {
      throw new Error('Please select at least one node to export');
    }

    const extractedNodes: FigmaNode[] = [];
    
    for (const node of selection) {
      const figmaNode = await this.extractNode(node);
      extractedNodes.push(figmaNode);
    }

    console.log('Extracted', extractedNodes.length, 'nodes with animation data');
    return extractedNodes;
  }

  private async extractNode(node: SceneNode): Promise<FigmaNode> {
    const baseNode: FigmaNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height
    };

    // Extract opacity
    if ('opacity' in node) {
      baseNode.opacity = node.opacity;
    }

    // Extract fills
    if ('fills' in node && Array.isArray(node.fills)) {
      baseNode.fills = this.extractFills(node.fills);
    }

    // Extract strokes  
    if ('strokes' in node && Array.isArray(node.strokes)) {
      baseNode.strokes = this.extractFills(node.strokes);
    }
    
    if ('strokeWeight' in node) {
      baseNode.strokeWeight = node.strokeWeight;
    }

    // Extract corner radius
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
      baseNode.cornerRadius = node.cornerRadius;
    }

    // Extract layout properties
    if ('layoutMode' in node) {
      baseNode.layoutMode = node.layoutMode;
    }
    
    if ('counterAxisAlignItems' in node) {
      baseNode.counterAxisAlignItems = node.counterAxisAlignItems as 'MIN' | 'CENTER' | 'MAX';
    }
    
    if ('primaryAxisAlignItems' in node) {
      baseNode.primaryAxisAlignItems = node.primaryAxisAlignItems as 'MIN' | 'CENTER' | 'MAX';
    }

    // Extract spacing and padding
    if ('itemSpacing' in node && typeof node.itemSpacing === 'number') {
      baseNode.itemSpacing = node.itemSpacing;
    }
    
    if ('paddingLeft' in node && typeof node.paddingLeft === 'number') {
      baseNode.paddingLeft = node.paddingLeft;
    }
    
    if ('paddingRight' in node && typeof node.paddingRight === 'number') {
      baseNode.paddingRight = node.paddingRight;
    }
    
    if ('paddingTop' in node && typeof node.paddingTop === 'number') {
      baseNode.paddingTop = node.paddingTop;
    }
    
    if ('paddingBottom' in node && typeof node.paddingBottom === 'number') {
      baseNode.paddingBottom = node.paddingBottom;
    }

    // Extract text properties
    if (node.type === 'TEXT') {
      if ('characters' in node) {
        baseNode.characters = node.characters;
      }
      
      if ('fontName' in node) {
        baseNode.fontName = node.fontName;
      }
      
      if ('fontFamily' in node && typeof node.fontFamily === 'string') {
        baseNode.fontFamily = node.fontFamily;
      }
      
      if ('fontSize' in node && typeof node.fontSize === 'number') {
        baseNode.fontSize = node.fontSize;
      }
      
      if ('fontWeight' in node && typeof node.fontWeight === 'number') {
        baseNode.fontWeight = node.fontWeight;
      }
      
      if ('textAlignHorizontal' in node) {
        baseNode.textAlignHorizontal = node.textAlignHorizontal;
      }
      
      if ('textAlignVertical' in node) {
        baseNode.textAlignVertical = node.textAlignVertical;
      }
      
      if ('letterSpacing' in node) {
        baseNode.letterSpacing = node.letterSpacing;
      }
      
      if ('lineHeight' in node) {
        baseNode.lineHeight = node.lineHeight;
      }
    }

    // Extract component properties
    if ('componentProperties' in node) {
      baseNode.componentProperties = node.componentProperties;
    }
    
    if ('mainComponentId' in node && typeof node.mainComponentId === 'string') {
      baseNode.mainComponentId = node.mainComponentId;
    }
    
    if ('variantProperties' in node) {
      baseNode.variantProperties = node.variantProperties;
    }

    // Extract reactions (critical for animations)
    if ('reactions' in node && Array.isArray(node.reactions)) {
      baseNode.reactions = this.extractReactions(node.reactions);
    }

    // Extract children
    if ('children' in node && Array.isArray(node.children)) {
      baseNode.children = [];
      for (const child of node.children) {
        const childNode = await this.extractNode(child);
        baseNode.children.push(childNode);
      }
    }

    return baseNode;
  }

  private extractFills(fills: readonly Paint[]): FigmaFill[] {
    return fills
      .filter((fill): fill is SolidPaint | GradientPaint => 
        fill.type === 'SOLID' || fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL'
      )
      .map(fill => {
        const figmaFill: FigmaFill = {
          type: fill.type as 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL',
          opacity: fill.opacity
        };

        if (fill.type === 'SOLID') {
          figmaFill.color = this.extractColor(fill.color);
        } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
          figmaFill.gradientStops = fill.gradientStops.map(stop => ({
            position: stop.position,
            color: this.extractColor(stop.color)
          }));
        }

        return figmaFill;
      });
  }

  private extractColor(color: RGB): FigmaColor {
    return {
      r: color.r,
      g: color.g,
      b: color.b
    };
  }

  private extractReactions(reactions: readonly Reaction[]): FigmaReaction[] {
    return reactions
      .filter((reaction): reaction is Reaction => 
        reaction.action && reaction.action.type === 'NODE'
      )
      .map(reaction => {
        const figmaReaction: FigmaReaction = {
          trigger: {
            type: reaction.trigger.type as 'ON_CLICK' | 'ON_PRESS' | 'AFTER_TIMEOUT' | 'ON_DRAG'
          },
          action: {
            type: 'NODE',
            destinationId: (reaction.action as any).destinationId || '',
            navigation: 'CHANGE_TO',
            transition: {
              type: (reaction.action as any).transition?.type || 'SMART_ANIMATE',
              easing: {
                type: (reaction.action as any).transition?.easing?.type || 'GENTLE'
              },
              duration: (reaction.action as any).transition?.duration || 0.3
            }
          }
        };

        // Extract timeout value for AFTER_TIMEOUT triggers
        if (reaction.trigger.type === 'AFTER_TIMEOUT' && 'timeout' in reaction.trigger) {
          figmaReaction.trigger.timeout = (reaction.trigger as any).timeout;
        }

        return figmaReaction;
      });
  }

  // Helper method to find component sets and their variants
  findComponentSets(nodes: FigmaNode[]): { componentSet: FigmaNode; variants: FigmaNode[] }[] {
    const componentSets: { componentSet: FigmaNode; variants: FigmaNode[] }[] = [];
    
    nodes.forEach(node => {
      if (node.type === 'COMPONENT_SET') {
        const variants = node.children?.filter(child => child.type === 'COMPONENT') || [];
        componentSets.push({
          componentSet: node,
          variants: variants
        });
      }
    });
    
    return componentSets;
  }

  // Helper method to trace animation chains
  traceAnimationChain(startNodeId: string, nodes: FigmaNode[]): string[] {
    const chain: string[] = [startNodeId];
    const visited = new Set<string>();
    let currentId = startNodeId;
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      
      const currentNode = nodes.find(n => n.id === currentId);
      if (!currentNode?.reactions) break;
      
      const timeoutReaction = currentNode.reactions.find(r => r.trigger.type === 'AFTER_TIMEOUT');
      if (!timeoutReaction) break;
      
      currentId = timeoutReaction.action.destinationId;
      if (currentId && !chain.includes(currentId)) {
        chain.push(currentId);
      } else {
        break; // Avoid infinite loops
      }
    }
    
    return chain;
  }
}
