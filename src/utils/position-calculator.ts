import { FigmaNode } from '../core/types';

export interface PositionAdjustment {
  x: number;
  y: number;
  reason: string;
}

export class PositionCalculator {
  /**
   * Calculate adjusted position for a node based on its layout context
   */
  static calculateAdjustedPosition(node: FigmaNode, parent?: FigmaNode): PositionAdjustment {
    // If no parent, return original position
    if (!parent) {
      return {
        x: node.x,
        y: node.y,
        reason: 'no_parent'
      };
    }

    // Check if this node itself has layout properties that should affect its positioning
    if (this.hasLayoutProperties(node)) {
      const selfLayoutAdjustment = this.calculateSelfLayoutPosition(node, parent);
      if (selfLayoutAdjustment) {
        return selfLayoutAdjustment;
      }
    }

    // Check if this is a layout-driven position that needs adjustment based on parent
    const layoutAdjustment = this.calculateLayoutDrivenPosition(node, parent);
    if (layoutAdjustment) {
      return layoutAdjustment;
    }

    // Check if this is a relative positioning case
    const relativeAdjustment = this.calculateRelativePosition(node, parent);
    if (relativeAdjustment) {
      return relativeAdjustment;
    }

    // Default: return original position
    return {
      x: node.x,
      y: node.y,
      reason: 'original_position'
    };
  }

  /**
   * Calculate position adjustments when the node itself has layout properties
   */
  private static calculateSelfLayoutPosition(node: FigmaNode, parent: FigmaNode): PositionAdjustment | null {
    // If the node has auto layout, its position should be calculated based on its layout properties
    // and the parent's bounds, but ONLY if the parent also has auto layout
    if (node.layoutMode && node.layoutMode !== 'NONE' && this.hasLayoutProperties(parent)) {
      const adjustedPosition = this.adjustPositionForLayout(node, parent);
      return {
        x: adjustedPosition.x,
        y: adjustedPosition.y,
        reason: 'self_layout_adjustment'
      };
    }

    return null;
  }

  /**
   * Calculate position adjustments for layout-driven positioning
   */
  private static calculateLayoutDrivenPosition(node: FigmaNode, parent: FigmaNode): PositionAdjustment | null {
    // Check if parent has layout properties that affect child positioning
    if (!this.hasLayoutProperties(parent)) {
      return null;
    }

    // Check if this is a case where the node position seems inconsistent with layout
    const isLayoutInconsistent = this.isPositionLayoutInconsistent(node, parent);
    if (!isLayoutInconsistent) {
      return null;
    }

    // Calculate adjusted position based on parent's layout properties
    const adjustedPosition = this.adjustPositionForLayout(node, parent);
    
    return {
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      reason: 'layout_driven_adjustment'
    };
  }

  /**
   * Calculate relative positioning adjustments
   */
  private static calculateRelativePosition(node: FigmaNode, parent: FigmaNode): PositionAdjustment | null {
    // Check if this node should be positioned relative to parent bounds
    if (this.shouldUseRelativePositioning(node, parent)) {
      const relativePosition = this.calculateRelativeToParent(node, parent);
      return {
        x: relativePosition.x,
        y: relativePosition.y,
        reason: 'relative_positioning'
      };
    }

    return null;
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
   * Check if node position is inconsistent with parent layout
   */
  private static isPositionLayoutInconsistent(node: FigmaNode, parent: FigmaNode): boolean {
    const parentWidth = parent.width || 0;
    const parentHeight = parent.height || 0;
    const nodeWidth = node.width || 0;
    const nodeHeight = node.height || 0;

    // Check if node is positioned outside parent bounds
    if (node.x < 0 || node.y < 0 || 
        node.x + nodeWidth > parentWidth || 
        node.y + nodeHeight > parentHeight) {
      return true;
    }

    // Check if node position seems arbitrary (very large values)
    // Note: Removed hardcoded 1000px threshold as modern designs can legitimately exceed this
    // Instead, check for extremely large values that would indicate data corruption
    const POSITION_THRESHOLD = 50000; // Much more reasonable threshold for detecting corrupt data
    if (node.x > POSITION_THRESHOLD || node.y > POSITION_THRESHOLD) {
      return true;
    }

    return false;
  }

  /**
   * Adjust position based on parent's layout properties
   */
  private static adjustPositionForLayout(node: FigmaNode, parent: FigmaNode): { x: number; y: number } {
    const parentWidth = parent.width || 0;
    const parentHeight = parent.height || 0;
    const nodeWidth = node.width || 0;
    const nodeHeight = node.height || 0;

    let adjustedX = node.x;
    let adjustedY = node.y;

    // Adjust based on primary axis alignment
    if (parent.primaryAxisAlignItems) {
      switch (parent.primaryAxisAlignItems) {
        case 'MIN':
          adjustedX = 0;
          break;
        case 'CENTER':
          adjustedX = (parentWidth - nodeWidth) / 2;
          break;
        case 'MAX':
          adjustedX = parentWidth - nodeWidth;
          break;
        default:
          // Keep original position for unknown alignment types
          break;
      }
    }

    // Adjust based on counter axis alignment
    if (parent.counterAxisAlignItems) {
      switch (parent.counterAxisAlignItems) {
        case 'MIN':
          adjustedY = 0;
          break;
        case 'CENTER':
          adjustedY = (parentHeight - nodeHeight) / 2;
          break;
        case 'MAX':
          adjustedY = parentHeight - nodeHeight;
          break;
      }
    }

    return { x: adjustedX, y: adjustedY };
  }

  /**
   * Check if node should use relative positioning
   */
  private static shouldUseRelativePositioning(node: FigmaNode, parent: FigmaNode): boolean {
    // Check if parent has HUG sizing and node has FIXED sizing
    if (parent.layoutSizingHorizontal === 'HUG' && 
        node.layoutSizingHorizontal === 'FIXED') {
      return true;
    }

    // Check if parent has HUG sizing and node has FIXED sizing
    if (parent.layoutSizingVertical === 'HUG' && 
        node.layoutSizingVertical === 'FIXED') {
      return true;
    }

    return false;
  }

  /**
   * Calculate position relative to parent
   */
  private static calculateRelativeToParent(node: FigmaNode, parent: FigmaNode): { x: number; y: number } {
    const parentWidth = parent.width || 0;
    const parentHeight = parent.height || 0;
    const nodeWidth = node.width || 0;
    const nodeHeight = node.height || 0;

    // For HUG sizing, position the node at the center of the parent
    let adjustedX = (parentWidth - nodeWidth) / 2;
    let adjustedY = (parentHeight - nodeHeight) / 2;

    // Ensure the node doesn't go outside parent bounds
    adjustedX = Math.max(0, Math.min(adjustedX, parentWidth - nodeWidth));
    adjustedY = Math.max(0, Math.min(adjustedY, parentHeight - nodeHeight));

    return { x: adjustedX, y: adjustedY };
  }
}
