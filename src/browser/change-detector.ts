import { AnimationChange, FigmaNodeData } from './types';

export class ChangeDetector {
  /**
   * Detect changes between two Figma nodes
   * @param source The source Figma node data (or current visual state)
   * @param target The target Figma node data
   */
  static detectChanges(source: FigmaNodeData, target: FigmaNodeData): AnimationChange[] {
    const changes: AnimationChange[] = [];

    // Note: We ignore position changes of top-level components since they should all be at (0,0)
    // Only child element position changes are relevant for animations

    // Size changes
    if (source.width !== target.width || source.height !== target.height) {
      changes.push({
        property: 'size',
        sourceValue: { width: source.width, height: source.height },
        targetValue: { width: target.width, height: target.height }
      });
    }

    // Opacity changes
    if (source.opacity !== target.opacity) {
      changes.push({
        property: 'opacity',
        sourceValue: source.opacity || 1,
        targetValue: target.opacity || 1
      });
    }

    // Background color changes
    if (this.fillsAreDifferent(source.fills, target.fills)) {
      changes.push({
        property: 'background',
        sourceValue: source.fills,
        targetValue: target.fills
      });
    }

    // Corner radius changes
    if (source.cornerRadius !== target.cornerRadius) {
      changes.push({
        property: 'borderRadius',
        sourceValue: source.cornerRadius || 0,
        targetValue: target.cornerRadius || 0
      });
    }

    // Layout changes
    if (this.layoutHasChanged(source, target)) {
      changes.push({
        property: 'layout',
        sourceValue: this.getLayoutProperties(source),
        targetValue: this.getLayoutProperties(target)
      });
    }

    // Vector path changes for SVG elements
    if (source.type === 'VECTOR' && target.type === 'VECTOR') {
      const pathChanges = this.detectVectorPathChanges(source, target);
      changes.push(...pathChanges);
    }

    // Child element changes (critical for variant animations)
    const childChanges = this.detectChildElementChanges(source, target);
    changes.push(...childChanges);

    return changes;
  }

  /**
   * Detect changes in child elements between variants (recursively)
   */
  private static detectChildElementChanges(source: FigmaNodeData, target: FigmaNodeData): AnimationChange[] {
    const changes: AnimationChange[] = [];
    
    // Recursively find all children with their full paths
    const sourceChildren = this.createRecursiveChildMap(source);
    const targetChildren = this.createRecursiveChildMap(target);
    
    for (const [childPath, sourceChild] of sourceChildren) {
      const targetChild = targetChildren.get(childPath);
      if (targetChild) {
        // Position changes in child elements
        if (sourceChild.x !== targetChild.x || sourceChild.y !== targetChild.y) {
          changes.push({
            property: 'childPosition',
            childName: childPath,
            childId: sourceChild.id,
            sourceValue: { x: sourceChild.x, y: sourceChild.y },
            targetValue: { x: targetChild.x, y: targetChild.y }
          });
        }
        
        // Size changes in child elements
        if (sourceChild.width !== targetChild.width || sourceChild.height !== targetChild.height) {
          changes.push({
            property: 'childSize',
            childName: childPath,
            childId: sourceChild.id,
            sourceValue: { width: sourceChild.width, height: sourceChild.height },
            targetValue: { width: targetChild.width, height: targetChild.height }
          });
        }
        
        // Opacity changes in child elements
        if (sourceChild.opacity !== targetChild.opacity) {
          changes.push({
            property: 'childOpacity',
            childName: childPath,
            childId: sourceChild.id,
            sourceValue: sourceChild.opacity || 1,
            targetValue: targetChild.opacity || 1
          });
        }
      }
    }
    
    return changes;
  }



  /**
   * Create a recursive map of all child elements with their full paths
   */
  private static createRecursiveChildMap(node: FigmaNodeData, prefix = ''): Map<string, FigmaNodeData> {
    const childMap = new Map();
    if (node.children) {
      node.children.forEach(child => {
        const childPath = prefix ? `${prefix}/${child.name}` : child.name;
        childMap.set(childPath, child);
        
        // Recursively add children of this child
        const nestedChildren = this.createRecursiveChildMap(child, childPath);
        nestedChildren.forEach((nestedChild, nestedPath) => {
          childMap.set(nestedPath, nestedChild);
        });
      });
    }
    return childMap;
  }

  /**
   * Check if fill arrays are different
   */
  private static fillsAreDifferent(sourceFills?: any[], targetFills?: any[]): boolean {
    if (!sourceFills && !targetFills) return false;
    if (!sourceFills || !targetFills) return true;
    if (sourceFills.length !== targetFills.length) return true;
    
    return sourceFills.some((fill, index) => {
      const targetFill = targetFills[index];
      return fill.type !== targetFill.type || 
             fill.opacity !== targetFill.opacity ||
             (fill.color && targetFill.color && 
              (fill.color.r !== targetFill.color.r || 
               fill.color.g !== targetFill.color.g || 
               fill.color.b !== targetFill.color.b));
    });
  }

  /**
   * Check if layout properties have changed
   */
  private static layoutHasChanged(source: FigmaNodeData, target: FigmaNodeData): boolean {
    return source.layoutMode !== target.layoutMode ||
           source.counterAxisAlignItems !== target.counterAxisAlignItems ||
           source.primaryAxisAlignItems !== target.primaryAxisAlignItems ||
           source.itemSpacing !== target.itemSpacing ||
           source.paddingLeft !== target.paddingLeft ||
           source.paddingRight !== target.paddingRight ||
           source.paddingTop !== target.paddingTop ||
           source.paddingBottom !== target.paddingBottom;
  }

  /**
   * Get layout properties from a node
   */
  private static getLayoutProperties(node: FigmaNodeData) {
    return {
      layoutMode: node.layoutMode,
      counterAxisAlignItems: node.counterAxisAlignItems,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      itemSpacing: node.itemSpacing,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom
    };
  }

  /**
   * Detect vector path changes for SVG elements
   */
  private static detectVectorPathChanges(source: FigmaNodeData, target: FigmaNodeData): AnimationChange[] {
    const changes: AnimationChange[] = [];

    // Check if vector paths have changed
    if (source.vectorPaths && target.vectorPaths) {
      if (source.vectorPaths.length !== target.vectorPaths.length) {
        changes.push({
          property: 'vectorPaths',
          sourceValue: source.vectorPaths,
          targetValue: target.vectorPaths
        });
      } else {
        // Check if any individual paths have changed
        for (let i = 0; i < source.vectorPaths.length; i++) {
          const sourcePath = source.vectorPaths[i];
          const targetPath = target.vectorPaths[i];
          
          if (sourcePath.data !== targetPath.data || sourcePath.windingRule !== targetPath.windingRule) {
            changes.push({
              property: 'vectorPaths',
              sourceValue: source.vectorPaths,
              targetValue: target.vectorPaths
            });
            break; // One change is enough to trigger animation
          }
        }
      }
    }

    return changes;
  }
}
