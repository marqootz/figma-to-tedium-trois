import { FigmaNode, FigmaReaction } from '../core/types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DataValidator {
  static validateFigmaNode(node: any): FigmaNode {
    if (!node || typeof node !== 'object') {
      throw new ValidationError('Node must be an object');
    }

    if (!node.id || typeof node.id !== 'string') {
      throw new ValidationError('Node must have a valid id', 'id');
    }

    if (!node.name || typeof node.name !== 'string') {
      throw new ValidationError('Node must have a valid name', 'name');
    }

    if (!node.type || typeof node.type !== 'string') {
      throw new ValidationError('Node must have a valid type', 'type');
    }

    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      throw new ValidationError('Node must have valid x,y coordinates', 'position');
    }

    if (typeof node.width !== 'number' || typeof node.height !== 'number' || 
        node.width < 0 || node.height < 0) {
      throw new ValidationError('Node must have valid positive dimensions', 'dimensions');
    }

    return node as FigmaNode;
  }

  static validateReactions(reactions: any[]): FigmaReaction[] {
    if (!Array.isArray(reactions)) {
      throw new ValidationError('Reactions must be an array');
    }

    return reactions.map((reaction, index) => {
      if (!reaction.trigger || !reaction.action) {
        throw new ValidationError(`Reaction ${index} must have trigger and action`);
      }

      if (!['ON_CLICK', 'ON_PRESS', 'AFTER_TIMEOUT', 'ON_DRAG'].includes(reaction.trigger.type)) {
        throw new ValidationError(`Reaction ${index} has invalid trigger type`);
      }

      if (reaction.trigger.type === 'AFTER_TIMEOUT' && typeof reaction.trigger.timeout !== 'number') {
        throw new ValidationError(`Timeout reaction ${index} must have numeric timeout value`);
      }

      if (!reaction.action.destinationId) {
        throw new ValidationError(`Reaction ${index} must have destinationId`);
      }

      return reaction as FigmaReaction;
    });
  }

  static validateAnimationChain(chain: string[], nodes: FigmaNode[]): boolean {
    if (!Array.isArray(chain) || chain.length < 2) {
      return false;
    }

    // Check that all nodes in chain exist
    for (const nodeId of chain) {
      if (!nodes.find(n => n.id === nodeId)) {
        throw new ValidationError(`Animation chain references missing node: ${nodeId}`);
      }
    }

    // Check that chain forms valid sequence
    for (let i = 0; i < chain.length - 1; i++) {
      const currentNode = nodes.find(n => n.id === chain[i]);
      const nextNodeId = chain[i + 1];
      
      if (!currentNode?.reactions) {
        throw new ValidationError(`Node ${chain[i]} in chain has no reactions`);
      }

      const hasValidReaction = currentNode.reactions.some(reaction => 
        reaction.action.destinationId === nextNodeId
      );

      if (!hasValidReaction) {
        throw new ValidationError(`No reaction found from ${chain[i]} to ${nextNodeId}`);
      }
    }

    return true;
  }

  static validateComponentSet(componentSet: FigmaNode): void {
    if (componentSet.type !== 'COMPONENT_SET') {
      throw new ValidationError('Node must be a COMPONENT_SET');
    }

    if (!componentSet.children || componentSet.children.length === 0) {
      throw new ValidationError('Component set must have variants (children)');
    }

    const variants = componentSet.children.filter(child => child.type === 'COMPONENT');
    if (variants.length === 0) {
      throw new ValidationError('Component set must have at least one COMPONENT variant');
    }

    // Check for circular references in animations
    variants.forEach(variant => {
      if (variant.reactions) {
        variant.reactions.forEach(reaction => {
          if (reaction.action.destinationId === variant.id) {
            throw new ValidationError(`Variant ${variant.name} has circular self-reference`);
          }
        });
      }
    });
  }
}


