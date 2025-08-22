import { FigmaNode } from './types';

export interface LayoutChange {
  type: 'alignment' | 'position' | 'size' | 'childPosition';
  sourceValue: any;
  targetValue: any;
  childId?: string;
  childPath?: string;
  parentId?: string;
}

export interface LayoutRule {
  condition: (source: FigmaNode, target: FigmaNode, sourceChild: FigmaNode, targetChild: FigmaNode) => boolean;
  action: (source: FigmaNode, target: FigmaNode, sourceChild: FigmaNode, targetChild: FigmaNode) => LayoutChange | null;
}

export class LayoutDetector {
  private static layoutRules: LayoutRule[] = [
    // Rule 1: Detect alignment changes in parent containers
    {
      condition: (source, target, sourceChild, targetChild) => {
        const sourceParent = this.findParentWithLayoutProperties(source, sourceChild);
        const targetParent = this.findParentWithLayoutProperties(target, targetChild);
        return !!(sourceParent && targetParent && 
               sourceParent.primaryAxisAlignItems !== targetParent.primaryAxisAlignItems);
      },
      action: (source, target, sourceChild, targetChild) => {
        const sourceParent = this.findParentWithLayoutProperties(source, sourceChild);
        const targetParent = this.findParentWithLayoutProperties(target, targetChild);
        
        if (!sourceParent || !targetParent) return null;
        
        // Calculate adjusted position based on alignment change
        const adjustedPosition = this.calculateAdjustedPosition(
          targetChild, 
          targetParent, 
          sourceParent.primaryAxisAlignItems || 'MIN',
          targetParent.primaryAxisAlignItems || 'MIN'
        );
        
        return {
          type: 'childPosition',
          sourceValue: { x: sourceChild.x, y: sourceChild.y },
          targetValue: adjustedPosition,
          childId: sourceChild.id,
          childPath: this.getChildPath(sourceChild),
          parentId: targetParent.id
        };
      }
    },
    
    // Rule 2: Detect size changes that affect child positioning
    {
      condition: (source, target, sourceChild, targetChild) => {
        const sourceParent = this.findParentWithLayoutProperties(source, sourceChild);
        const targetParent = this.findParentWithLayoutProperties(target, targetChild);
        return !!(sourceParent && targetParent && 
               (sourceParent.width !== targetParent.width || sourceParent.height !== targetParent.height));
      },
      action: (source, target, sourceChild, targetChild) => {
        const sourceParent = this.findParentWithLayoutProperties(source, sourceChild);
        const targetParent = this.findParentWithLayoutProperties(target, targetChild);
        
        if (!sourceParent || !targetParent) return null;
        
        // Recalculate child position based on new parent size
        const adjustedPosition = this.recalculateChildPosition(
          sourceChild,
          targetChild,
          sourceParent,
          targetParent
        );
        
        return {
          type: 'childPosition',
          sourceValue: { x: sourceChild.x, y: sourceChild.y },
          targetValue: adjustedPosition,
          childId: sourceChild.id,
          childPath: this.getChildPath(sourceChild),
          parentId: targetParent.id
        };
      }
    }
  ];

  /**
   * Detect all layout-driven changes between source and target nodes
   */
  static detectLayoutChanges(
    source: FigmaNode, 
    target: FigmaNode, 
    sourceChild: FigmaNode, 
    targetChild: FigmaNode
  ): LayoutChange | null {
    // Apply all layout rules
    for (const rule of this.layoutRules) {
      if (rule.condition(source, target, sourceChild, targetChild)) {
        const change = rule.action(source, target, sourceChild, targetChild);
        if (change) {
          return change;
        }
      }
    }
    
    return null;
  }

  /**
   * Find parent node with layout properties
   */
  private static findParentWithLayoutProperties(node: FigmaNode, child: FigmaNode): FigmaNode | null {
    return this.findParentRecursive(node, child, (parent) => 
      this.hasLayoutProperties(parent)
    );
  }

  /**
   * Check if a node has layout properties
   */
  private static hasLayoutProperties(node: FigmaNode): boolean {
    // Only consider it a layout-driven change if the parent actually uses auto layout
    // (layoutMode is not 'NONE'). Properties like primaryAxisAlignItems can exist
    // even in absolute positioning mode but don't affect positioning.
    return node.layoutMode !== 'NONE' && node.layoutMode !== undefined;
  }

  /**
   * Find parent recursively that matches a condition
   */
  private static findParentRecursive(
    node: FigmaNode, 
    targetChild: FigmaNode, 
    condition: (parent: FigmaNode) => boolean
  ): FigmaNode | null {
    if (!node.children) return null;
    
    for (const child of node.children) {
      if (child.id === targetChild.id) {
        return condition(node) ? node : null;
      }
      
      const found = this.findParentRecursive(child, targetChild, condition);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Calculate adjusted position based on alignment changes
   */
  private static calculateAdjustedPosition(
    child: FigmaNode,
    parent: FigmaNode,
    sourceAlignment: string,
    targetAlignment: string
  ): { x: number; y: number } {
    const parentWidth = parent.width || 0;
    const childWidth = child.width || 0;
    
    let adjustedX = child.x;
    let adjustedY = child.y;
    
    // Handle horizontal alignment changes
    if (sourceAlignment !== targetAlignment) {
      switch (targetAlignment) {
        case 'MIN':
          adjustedX = 0;
          break;
        case 'CENTER':
          adjustedX = (parentWidth - childWidth) / 2;
          break;
        case 'MAX':
          adjustedX = parentWidth - childWidth;
          break;
        case 'SPACE_BETWEEN':
          // For space between, we need to know the number of children
          // This is a simplified implementation
          adjustedX = 0;
          break;
      }
    }
    
    return { x: adjustedX, y: adjustedY };
  }

  /**
   * Recalculate child position based on parent size changes
   */
  private static recalculateChildPosition(
    sourceChild: FigmaNode,
    _targetChild: FigmaNode,
    sourceParent: FigmaNode,
    targetParent: FigmaNode
  ): { x: number; y: number } {
    const sourceParentWidth = sourceParent.width || 0;
    const targetParentWidth = targetParent.width || 0;
    const sourceParentHeight = sourceParent.height || 0;
    const targetParentHeight = targetParent.height || 0;
    
    // Calculate relative position within parent
    const relativeX = sourceChild.x / sourceParentWidth;
    const relativeY = sourceChild.y / sourceParentHeight;
    
    // Apply relative position to new parent size
    const adjustedX = relativeX * targetParentWidth;
    const adjustedY = relativeY * targetParentHeight;
    
    return { x: adjustedX, y: adjustedY };
  }

  /**
   * Get the path to a child node for debugging
   */
  private static getChildPath(child: FigmaNode): string {
    return child.name || child.id;
  }

}
