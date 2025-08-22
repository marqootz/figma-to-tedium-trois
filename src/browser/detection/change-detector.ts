import { AnimationChange } from '../types/animation-types';

export class ChangeDetector {
  static detectChanges(source: any, target: any): AnimationChange[] {
    const changes: AnimationChange[] = [];

    // Note: We ignore position changes of top-level components since they should all be at (0,0)
    // Only child element position changes are relevant for animations

    // Size changes
    if (source.width !== target.width || source.height !== target.height) {
      changes.push(new AnimationChange('size', { width: source.width, height: source.height }, { width: target.width, height: target.height }));
    }

    // Opacity changes
    if (source.opacity !== target.opacity) {
      changes.push(new AnimationChange('opacity', source.opacity || 1, target.opacity || 1));
    }

    // Background color changes
    console.log('🔍 Checking fills - source:', source.fills, 'target:', target.fills);
    if (this.fillsAreDifferent(source.fills, target.fills)) {
      console.log('🔍 Fills are different, adding background change');
      changes.push(new AnimationChange('background', source.fills, target.fills));
    } else {
      console.log('🔍 Fills are the same or both empty');
    }

    // Check for background color changes in child elements
    const childBackgroundChanges = this.detectChildBackgroundChanges(source, target);
    if (childBackgroundChanges.length > 0) {
      console.log('🔍 Found child background changes:', childBackgroundChanges.length);
      changes.push(...childBackgroundChanges);
    }

    // Corner radius changes
    if (source.cornerRadius !== target.cornerRadius) {
      changes.push(new AnimationChange('borderRadius', source.cornerRadius || 0, target.cornerRadius || 0));
    }

    // Layout changes
    if (this.layoutHasChanged(source, target)) {
      changes.push(new AnimationChange('layout', this.getLayoutProperties(source), this.getLayoutProperties(target)));
    }

    // Sizing property changes
    if (source.layoutSizingHorizontal !== target.layoutSizingHorizontal || source.layoutSizingVertical !== target.layoutSizingVertical) {
      changes.push(new AnimationChange('sizing', { 
        horizontal: source.layoutSizingHorizontal, 
        vertical: source.layoutSizingVertical 
      }, { 
        horizontal: target.layoutSizingHorizontal, 
        vertical: target.layoutSizingVertical 
      }));
    }

    // Child element changes
    const childChanges = this.detectChildElementChanges(source, target);
    changes.push(...childChanges);

    return changes;
  }

  static detectChildElementChanges(source: any, target: any): AnimationChange[] {
    const changes: AnimationChange[] = [];
    
    // Recursively find all children with their full paths
    const sourceChildren = this.createRecursiveChildMap(source);
    const targetChildren = this.createRecursiveChildMap(target);
    
    for (const [childPath, sourceChild] of sourceChildren) {
      const targetChild = targetChildren.get(childPath);
      if (targetChild) {
        if (sourceChild.x !== targetChild.x || sourceChild.y !== targetChild.y) {
          // Check if this is a layout-driven position change
          const layoutDrivenChange = this.detectLayoutDrivenPositionChange(source, target, sourceChild, targetChild);
          if (layoutDrivenChange) {
            changes.push(layoutDrivenChange);
          } else {
            changes.push(new AnimationChange('childPosition', { x: sourceChild.x, y: sourceChild.y }, { x: targetChild.x, y: targetChild.y }, undefined, childPath, sourceChild.id));
          }
        }
        
        if (sourceChild.width !== targetChild.width || sourceChild.height !== targetChild.height) {
          changes.push(new AnimationChange('childSize', { width: sourceChild.width, height: sourceChild.height }, { width: targetChild.width, height: targetChild.height }, undefined, childPath, sourceChild.id));
        }
        
        if (sourceChild.opacity !== targetChild.opacity) {
          changes.push(new AnimationChange('childOpacity', sourceChild.opacity || 1, targetChild.opacity || 1, undefined, childPath, sourceChild.id));
        }
      }
    }
    
    return changes;
  }

  static detectChildBackgroundChanges(source: any, target: any): AnimationChange[] {
    const changes: AnimationChange[] = [];
    
    // Recursively find all children with their full paths
    const sourceChildren = this.createRecursiveChildMap(source);
    const targetChildren = this.createRecursiveChildMap(target);
    
    for (const [childPath, sourceChild] of sourceChildren) {
      const targetChild = targetChildren.get(childPath);
      if (targetChild && this.fillsAreDifferent(sourceChild.fills, targetChild.fills)) {
        // Check if this is an SVG element (VECTOR type)
        const isSVG = sourceChild.type === 'VECTOR';
        
        if (isSVG) {
          console.log('🔍 SVG color change detected for:', childPath, 'source fills:', sourceChild.fills, 'target fills:', targetChild.fills);
          // For SVG elements, we want to change the fill color, not background color
          changes.push(new AnimationChange('childFill', sourceChild.fills, targetChild.fills, undefined, childPath, sourceChild.id));
        } else {
          console.log('🔍 Child background change detected for:', childPath, 'source fills:', sourceChild.fills, 'target fills:', targetChild.fills);
          changes.push(new AnimationChange('childBackground', sourceChild.fills, targetChild.fills, undefined, childPath, sourceChild.id));
        }
      }
    }
    
    return changes;
  }

  static detectLayoutDrivenPositionChange(source: any, target: any, sourceChild: any, targetChild: any): AnimationChange | null {
    console.log('🔍 Checking layout-driven change for:', sourceChild.name);
    
    // Use generic layout detection instead of hardcoded element references
    const layoutChange = this.detectGenericLayoutChange(source, target, sourceChild, targetChild);
    
    if (layoutChange) {
      console.log('🔍 Detected layout-driven change');
      return layoutChange;
    }
    
    console.log('🔍 No layout-driven change detected');
    return null;
  }

  static detectGenericLayoutChange(source: any, target: any, sourceChild: any, targetChild: any): AnimationChange | null {
    // Check for alignment changes in parent containers
    const sourceParent = this.findParentWithLayoutProperties(source, sourceChild);
    const targetParent = this.findParentWithLayoutProperties(target, targetChild);
    
    if (sourceParent && targetParent) {
      // Check if alignment changed
      if (sourceParent.primaryAxisAlignItems !== targetParent.primaryAxisAlignItems) {
        console.log('🔍 Layout alignment changed from', sourceParent.primaryAxisAlignItems, 'to', targetParent.primaryAxisAlignItems);
        
        const adjustedPosition = this.calculateAdjustedPosition(
          targetChild, 
          targetParent, 
          sourceParent.primaryAxisAlignItems,
          targetParent.primaryAxisAlignItems
        );
        
        return new AnimationChange('childPosition', 
          { x: sourceChild.x, y: sourceChild.y }, 
          adjustedPosition, 
          undefined, 
          this.getChildPath(sourceChild), 
          sourceChild.id
        );
      }
      
      // Check if parent size changed affecting child positioning
      if (sourceParent.width !== targetParent.width || sourceParent.height !== targetParent.height) {
        console.log('🔍 Parent size changed, recalculating child position');
        
        const adjustedPosition = this.recalculateChildPosition(
          sourceChild,
          targetChild,
          sourceParent,
          targetParent
        );
        
        return new AnimationChange('childPosition', 
          { x: sourceChild.x, y: sourceChild.y }, 
          adjustedPosition, 
          undefined, 
          this.getChildPath(sourceChild), 
          sourceChild.id
        );
      }
    }
    
    return null;
  }

  static findParentWithLayoutProperties(node: any, child: any): any {
    return this.findParentRecursive(node, child, (parent: any) => 
      this.hasLayoutProperties(parent)
    );
  }

  static hasLayoutProperties(node: any): boolean {
    // Only consider it a layout-driven change if the parent actually uses auto layout
    // (layoutMode is not 'NONE'). Properties like primaryAxisAlignItems can exist
    // even in absolute positioning mode but don't affect positioning.
    return node.layoutMode !== 'NONE' && node.layoutMode !== undefined;
  }

  static findParentRecursive(node: any, targetChild: any, condition: (parent: any) => boolean): any {
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

  static calculateAdjustedPosition(child: any, parent: any, sourceAlignment: string, targetAlignment: string): { x: number; y: number } {
    const parentWidth = parent.width || 0;
    const childWidth = child.width || 0;
    
    let adjustedX = child.x;
    
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
    
    return { x: adjustedX, y: child.y };
  }

  static recalculateChildPosition(sourceChild: any, _targetChild: any, sourceParent: any, targetParent: any): { x: number; y: number } {
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

  static getChildPath(child: any): string {
    // Extract the child name from the full path for the change
    const pathParts = child.name ? child.name.split('/') : [];
    return pathParts[pathParts.length - 1] || child.name || '';
  }

  static createRecursiveChildMap(node: any, prefix = ''): Map<string, any> {
    const childMap = new Map<string, any>();
    if (node.children) {
      node.children.forEach((child: any) => {
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

  static fillsAreDifferent(sourceFills: any[], targetFills: any[]): boolean {
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

  static layoutHasChanged(source: any, target: any): boolean {
    return source.layoutMode !== target.layoutMode ||
           source.counterAxisAlignItems !== target.counterAxisAlignItems ||
           source.primaryAxisAlignItems !== target.primaryAxisAlignItems ||
           source.itemSpacing !== target.itemSpacing ||
           source.paddingLeft !== target.paddingLeft ||
           source.paddingRight !== target.paddingRight ||
           source.paddingTop !== target.paddingTop ||
           source.paddingBottom !== target.paddingBottom;
  }

  static getLayoutProperties(node: any): any {
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
}
