import { FigmaNodeData } from './types';

export class BundleGenerator {
  /**
   * Generate the complete browser bundle as a string
   */
  static generateBundle(): string {
    return `
      // Figma Animation System Bundle
      // Generated from TypeScript modules
      
      ${this.getTypesCode()}
      ${this.getChangeDetectorCode()}
      ${this.getDOMManipulatorCode()}
      ${this.getVariantHandlerCode()}
      ${this.getAnimationSystemCode()}
      
      // Global initialization
      window.FigmaAnimationSystem = FigmaAnimationSystem;
    `;
  }

  /**
   * Generate initialization code for the animation system
   */
  static generateInitializationCode(
    nodes: FigmaNodeData[], 
    resolvedInstances?: any[]
  ): string {
    return `
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize animation system
        window.figmaAnimationSystem = new FigmaAnimationSystem();
        
        // Register all nodes and elements
        ${this.generateNodeRegistrations(nodes)}
        
        // Register variant elements if we have resolved instances
        ${resolvedInstances ? this.generateVariantRegistrations(resolvedInstances) : ''}
        
        // Setup initial timeout reactions
        ${this.generateInitialTimeouts(nodes, resolvedInstances)}
        
        // Setup variant animation system
        ${resolvedInstances ? this.generateVariantAnimationSetup(resolvedInstances) : ''}
        
        // Register all collected variant instances
        if (window._tempVariantInstances && window._tempVariantInstances.length > 0) {
          console.log('🎭 Final registration of', window._tempVariantInstances.length, 'variant instances');
          window.figmaAnimationSystem.registerVariantInstances(window._tempVariantInstances);
          
          // Initialize variant visibility - ensure only active variants are visible
          window._tempVariantInstances.forEach(variantInstance => {
            // Hide the instance element initially - we only want variants visible
            const instanceElement = document.querySelector(\`[data-figma-id="\${variantInstance.instanceId}"]\`);
            if (instanceElement) {
              instanceElement.style.display = 'none';
            }
            
            variantInstance.variants.forEach(variantId => {
              const element = document.querySelector(\`[data-figma-id="\${variantId}"]\`);
              if (element) {
                if (variantId === variantInstance.activeVariant) {
                  element.style.setProperty('display', 'block', 'important');
                  element.style.setProperty('opacity', '1', 'important');
                } else {
                  element.style.setProperty('display', 'none', 'important');
                  element.style.setProperty('opacity', '0', 'important');
                }
              }
            });
          });
          
          delete window._tempVariantInstances;
        }
        
        // Setup click reactions AFTER variant visibility is initialized
        ${this.generateInitialClicks(nodes, resolvedInstances)}
        
        console.log('Animation system initialized with ${nodes.length} nodes${resolvedInstances ? ' and ' + resolvedInstances.length + ' resolved instances' : ''}');
      });
    `;
  }

  private static getTypesCode(): string {
    return `
      // Type definitions
      class AnimationChange {
        constructor(property, sourceValue, targetValue, delta, childName, childId) {
          this.property = property;
          this.sourceValue = sourceValue;
          this.targetValue = targetValue;
          this.delta = delta;
          this.childName = childName;
          this.childId = childId;
        }
      }
      
      class AnimationOptions {
        constructor(duration, easing, transitionType) {
          this.duration = duration;
          this.easing = easing;
          this.transitionType = transitionType;
        }
      }
      
      class VariantInstance {
        constructor(instanceId, variants, activeVariant, currentIndex) {
          this.instanceId = instanceId;
          this.variants = variants;
          this.activeVariant = activeVariant;
          this.currentIndex = currentIndex;
        }
      }
    `;
  }

  private static getChangeDetectorCode(): string {
    return `
      class ChangeDetector {
        static detectChanges(source, target) {
          const changes = [];

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

        static detectChildElementChanges(source, target) {
          const changes = [];
          
          // Recursively find all children with their full paths
          const sourceChildren = this.createRecursiveChildMap(source);
          const targetChildren = this.createRecursiveChildMap(target);
          
          for (const [childPath, sourceChild] of sourceChildren) {
            const targetChild = targetChildren.get(childPath);
            if (targetChild) {
              if (sourceChild.x !== targetChild.x || sourceChild.y !== targetChild.y) {
                // Check if this is a layout-driven position change
                const layoutDrivenChange = this.detectLayoutDrivenPositionChange(source, target, sourceChild, targetChild, childPath);
                if (layoutDrivenChange) {
                  changes.push(layoutDrivenChange);
                } else {
                  changes.push(new AnimationChange('childPosition', { x: sourceChild.x, y: sourceChild.y }, { x: targetChild.x, y: targetChild.y }, null, childPath, sourceChild.id));
                }
              }
              
              if (sourceChild.width !== targetChild.width || sourceChild.height !== targetChild.height) {
                changes.push(new AnimationChange('childSize', { width: sourceChild.width, height: sourceChild.height }, { width: targetChild.width, height: targetChild.height }, null, childPath, sourceChild.id));
              }
              
              if (sourceChild.opacity !== targetChild.opacity) {
                changes.push(new AnimationChange('childOpacity', sourceChild.opacity || 1, targetChild.opacity || 1, null, childPath, sourceChild.id));
              }
            }
          }
          
          return changes;
        }

        static detectChildBackgroundChanges(source, target) {
          const changes = [];
          
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
                changes.push(new AnimationChange('childFill', sourceChild.fills, targetChild.fills, null, childPath, sourceChild.id));
              } else {
                console.log('🔍 Child background change detected for:', childPath, 'source fills:', sourceChild.fills, 'target fills:', targetChild.fills);
                changes.push(new AnimationChange('childBackground', sourceChild.fills, targetChild.fills, null, childPath, sourceChild.id));
              }
            }
          }
          
          return changes;
        }

        static detectLayoutDrivenPositionChange(source, target, sourceChild, targetChild, childPath) {
          console.log('🔍 Checking layout-driven change for:', sourceChild.name);
          
          // Use generic layout detection instead of hardcoded element references
          const layoutChange = this.detectGenericLayoutChange(source, target, sourceChild, targetChild);
          
          if (layoutChange) {
            console.log('🔍 Detected layout-driven change:', layoutChange.type);
            return layoutChange;
          }
          
          console.log('🔍 No layout-driven change detected');
          return null;
        }

        static detectGenericLayoutChange(source, target, sourceChild, targetChild) {
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
                null, 
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
                null, 
                this.getChildPath(sourceChild), 
                sourceChild.id
              );
            }
          }
          
          return null;
        }

        static findParentWithLayoutProperties(node, child) {
          return this.findParentRecursive(node, child, (parent) => 
            this.hasLayoutProperties(parent)
          );
        }

        static hasLayoutProperties(node) {
          // Only consider it a layout-driven change if the parent actually uses auto layout
          // (layoutMode is not 'NONE'). Properties like primaryAxisAlignItems can exist
          // even in absolute positioning mode but don't affect positioning.
          return node.layoutMode !== 'NONE' && node.layoutMode !== undefined;
        }

        static findParentRecursive(node, targetChild, condition) {
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

        static calculateAdjustedPosition(child, parent, sourceAlignment, targetAlignment) {
          const parentWidth = parent.width || 0;
          const parentHeight = parent.height || 0;
          const childWidth = child.width || 0;
          const childHeight = child.height || 0;
          
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

        static recalculateChildPosition(sourceChild, targetChild, sourceParent, targetParent) {
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

        static findParentWithLayoutChange(node, child) {
          console.log('🔍 Searching for parent of child:', child.name, 'in node:', node.name);
          
          // Search through the node's children to find the parent that contains the child
          if (node.children) {
            for (const childNode of node.children) {
              console.log('🔍 Checking child node:', childNode.name, 'for child:', child.name);
              
              // Check if this child node contains our target child
              if (this.containsChild(childNode, child)) {
                console.log('🔍 Found child in:', childNode.name);
                
                // Check if this child node has layout properties
                if (childNode.primaryAxisAlignItems !== undefined || childNode.counterAxisAlignItems !== undefined) {
                  console.log('🔍 This node has layout properties:', childNode.primaryAxisAlignItems);
                  return childNode;
                }
                
                // If not, look deeper in this child node
                const found = this.findParentWithLayoutChange(childNode, child);
                if (found) return found;
              }
            }
          }
          
          console.log('🔍 No parent with layout change found for:', child.name);
          return null;
        }

        static containsChild(parent, child) {
          if (parent.id === child.id) {
            return true;
          }
          
          if (parent.children) {
            for (const childNode of parent.children) {
              if (this.containsChild(childNode, child)) {
                return true;
              }
            }
          }
          
          return false;
        }

        static getChildPath(child) {
          // Extract the child name from the full path for the change
          const pathParts = child.name ? child.name.split('/') : [];
          return pathParts[pathParts.length - 1] || child.name || '';
        }



        static createRecursiveChildMap(node, prefix = '') {
          const childMap = new Map();
          if (node.children) {
            node.children.forEach(child => {
              const childPath = prefix ? \`\${prefix}/\${child.name}\` : child.name;
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

        static fillsAreDifferent(sourceFills, targetFills) {
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

        static layoutHasChanged(source, target) {
          return source.layoutMode !== target.layoutMode ||
                 source.counterAxisAlignItems !== target.counterAxisAlignItems ||
                 source.primaryAxisAlignItems !== target.primaryAxisAlignItems ||
                 source.itemSpacing !== target.itemSpacing ||
                 source.paddingLeft !== target.paddingLeft ||
                 source.paddingRight !== target.paddingRight ||
                 source.paddingTop !== target.paddingTop ||
                 source.paddingBottom !== target.paddingBottom;
        }

        static getLayoutProperties(node) {
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
    `;
  }

  private static getDOMManipulatorCode(): string {
    return `
      class DOMManipulator {
        static prepareChange(element, change) {
          switch (change.property) {
            case 'position':
              const { x, y } = change.targetValue;
              return { type: 'transform', value: \`translate(\${x}px, \${y}px)\`, target: element };
            case 'size':
              const { width, height } = change.targetValue;
              return { type: 'size', width, height, target: element };
            case 'opacity':
              return { type: 'opacity', value: change.targetValue.toString(), target: element };
            case 'background':
              const fill = change.targetValue[0];
              if (fill && fill.color) {
                const { r, g, b } = fill.color;
                const alpha = fill.opacity || 1;
                return { type: 'backgroundColor', value: \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`, target: element };
              }
              return null;
            case 'borderRadius':
              return { type: 'borderRadius', value: change.targetValue + 'px', target: element };
            case 'childPosition':
              const childElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (childElement) {
                const deltaX = change.targetValue.x - change.sourceValue.x;
                const deltaY = change.targetValue.y - change.sourceValue.y;
                console.log('🎬 Position calculation:', {
                  source: change.sourceValue,
                  target: change.targetValue,
                  deltaX,
                  deltaY,
                  childId: change.childId
                });
                return { type: 'transform', value: \`translate(\${deltaX}px, \${deltaY}px)\`, target: childElement };
              }
              return null;
            case 'childSize':
              const sizeChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (sizeChildElement) {
                const { width, height } = change.targetValue;
                return { type: 'childSize', width, height, target: sizeChildElement };
              }
              return null;
            case 'childOpacity':
              const opacityChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (opacityChildElement) {
                return { type: 'opacity', value: change.targetValue.toString(), target: opacityChildElement };
              }
              return null;
            case 'childBackground':
              const backgroundChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (backgroundChildElement) {
                const fill = change.targetValue[0];
                if (fill && fill.color) {
                  const { r, g, b } = fill.color;
                  const alpha = fill.opacity || 1;
                  return { type: 'backgroundColor', value: \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`, target: backgroundChildElement };
                }
              }
              return null;
            case 'childFill':
              const fillChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (fillChildElement) {
                // For SVG elements, we need to traverse: svg > g > path
                const pathElement = fillChildElement.querySelector('g path') || fillChildElement.querySelector('path');
                if (pathElement) {
                  const fill = change.targetValue[0];
                  if (fill && fill.color) {
                    const { r, g, b } = fill.color;
                    const alpha = fill.opacity || 1;
                    return { type: 'fill', value: \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`, target: pathElement };
                  }
                }
              }
              return null;
            default:
              return null;
          }
        }

        static applyStyleChange(element, styleChange) {
          switch (styleChange.type) {
            case 'transform':
              styleChange.target.style.transform = styleChange.value;
              break;
            case 'size':
              styleChange.target.style.width = styleChange.width + 'px';
              styleChange.target.style.height = styleChange.height + 'px';
              break;
            case 'opacity':
              styleChange.target.style.opacity = styleChange.value;
              break;
            case 'backgroundColor':
              console.log('🎨 Applying background color to element:', styleChange.target.getAttribute('data-figma-id'), 'value:', styleChange.value);
              styleChange.target.style.backgroundColor = styleChange.value;
              break;
            case 'fill':
              console.log('🎨 Applying fill color to path element:', styleChange.target.tagName, 'value:', styleChange.value);
              styleChange.target.style.fill = styleChange.value;
              break;
            case 'borderRadius':
              styleChange.target.style.borderRadius = styleChange.value;
              break;
            case 'childSize':
              styleChange.target.style.width = styleChange.width + 'px';
              styleChange.target.style.height = styleChange.height + 'px';
              break;
          }
        }

        static applyChange(element, change) {
          console.log('Applying change:', change.property, '=', change.targetValue);

          switch (change.property) {
            case 'position':
              const { x, y } = change.targetValue;
              element.style.transform = \`translate(\${x}px, \${y}px)\`;
              break;
            case 'size':
              const { width, height } = change.targetValue;
              element.style.width = width + 'px';
              element.style.height = height + 'px';
              break;
            case 'opacity':
              element.style.opacity = change.targetValue.toString();
              break;
            case 'background':
              const fill = change.targetValue[0];
              if (fill && fill.color) {
                const { r, g, b } = fill.color;
                const alpha = fill.opacity || 1;
                element.style.backgroundColor = \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`;
              }
              break;
            case 'borderRadius':
              element.style.borderRadius = change.targetValue + 'px';
              break;
            case 'sizing':
              const { horizontal, vertical } = change.targetValue;
              
              // Apply horizontal sizing
              if (horizontal) {
                switch (horizontal) {
                  case 'FILL':
                    element.style.width = '100%';
                    break;
                  case 'HUG':
                    element.style.width = 'fit-content';
                    break;
                  case 'FIXED':
                    // Width should already be set, no change needed
                    break;
                }
              }
              
              // Apply vertical sizing
              if (vertical) {
                switch (vertical) {
                  case 'FILL':
                    element.style.height = '100%';
                    break;
                  case 'HUG':
                    element.style.height = 'fit-content';
                    break;
                  case 'FIXED':
                    // Height should already be set, no change needed
                    break;
                }
              }
              break;
            case 'childPosition':
              // Try to find the child by the change.childId
              let childElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              
              if (!childElement) {
                // If not found, try to find by name path instead
                const pathParts = change.childName.split('/');
                const childName = pathParts[pathParts.length - 1]; // Get the last part
                const allChildrenWithName = element.querySelectorAll(\`[data-figma-name="\${childName}"]\`);
                if (allChildrenWithName.length > 0) {
                  childElement = allChildrenWithName[0]; // Take the first match
                }
              }
              
              if (childElement) {
                // Calculate relative delta instead of absolute position
                const deltaX = change.targetValue.x - change.sourceValue.x;
                const deltaY = change.targetValue.y - change.sourceValue.y;
                childElement.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;
              }
              break;
            case 'childSize':
              const sizeChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (sizeChildElement) {
                const { width, height } = change.targetValue;
                sizeChildElement.style.width = width + 'px';
                sizeChildElement.style.height = height + 'px';
                console.log('Applied child size change to', change.childName, ':', width, height);
              }
              break;
            case 'childOpacity':
              const opacityChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (opacityChildElement) {
                opacityChildElement.style.opacity = change.targetValue.toString();
                console.log('Applied child opacity change to', change.childName, ':', change.targetValue);
              }
              break;
            case 'childBackground':
              const backgroundChildElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
              if (backgroundChildElement) {
                const fill = change.targetValue[0];
                if (fill && fill.color) {
                  const { r, g, b } = fill.color;
                  const alpha = fill.opacity || 1;
                  backgroundChildElement.style.backgroundColor = \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`;
                  console.log('Applied child background change to', change.childName, ':', \`rgba(\${Math.round(r * 255)}, \${Math.round(g * 255)}, \${Math.round(b * 255)}, \${alpha})\`);
                }
              }
              break;
          }
        }

        static setupTransitions(element, changes, options) {
          const transitionProperties = this.getTransitionProperties(changes);
          const transitionString = transitionProperties
            .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
            .join(', ');
          
          console.log('🎬 Setting up transitions for element:', element.getAttribute('data-figma-id'));
          console.log('🎬 Transition properties:', transitionProperties);
          console.log('🎬 Transition string:', transitionString);
          
          element.style.transition = transitionString;
        }

        static setupChildTransitions(element, changes, options) {
          const childChanges = changes.filter(change => 
            change.property === 'childPosition' || 
            change.property === 'childSize' || 
            change.property === 'childOpacity' ||
            change.property === 'childBackground' ||
            change.property === 'childFill'
          );
          
          childChanges.forEach(change => {
            const childElement = element.querySelector(\`[data-figma-id="\${change.childId}"]\`);
            if (childElement) {
              const childTransitionProps = [];
              if (change.property === 'childPosition' || change.property === 'childSize') {
                childTransitionProps.push('transform');
              }
              if (change.property === 'childOpacity') {
                childTransitionProps.push('opacity');
              }
              if (change.property === 'childBackground') {
                childTransitionProps.push('background-color');
              }
              if (change.property === 'childFill') {
                childTransitionProps.push('fill');
              }
              if (childTransitionProps.length > 0) {
                childElement.style.transition = childTransitionProps
                  .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
                  .join(', ');
              }
            }
          });
        }

        static applyLayoutFlattening(element, layoutChange) {
          const parent = element.parentElement;
          if (parent && parent.style.display === 'flex') {
            const children = Array.from(parent.children);
            children.forEach(child => {
              const rect = child.getBoundingClientRect();
              const parentRect = parent.getBoundingClientRect();
              
              child.style.position = 'absolute';
              child.style.left = (rect.left - parentRect.left) + 'px';
              child.style.top = (rect.top - parentRect.top) + 'px';
              child.style.width = rect.width + 'px';
              child.style.height = rect.height + 'px';
            });
            
            parent.style.display = 'block';
          }
        }

        static performVariantSwitch(sourceElement, targetElement) {
          console.log('Performing instant variant switch');
          
          const componentSet = sourceElement.closest('[data-component-set]');
          if (componentSet) {
            const variants = componentSet.querySelectorAll('[data-variant]');
            variants.forEach(variant => {
              variant.style.display = 'none';
            });
          }

          targetElement.style.display = '';
          targetElement.style.opacity = '1';
          targetElement.style.transform = '';
        }

        static getTransitionProperties(changes) {
          const properties = new Set();
          
          changes.forEach(change => {
            switch (change.property) {
              case 'position':
              case 'size':
              case 'childPosition':
              case 'childSize':
                properties.add('transform');
                break;
              case 'opacity':
                          case 'childOpacity':
              properties.add('opacity');
              break;
            case 'childBackground':
              properties.add('background-color');
              break;
            case 'childFill':
              properties.add('fill');
              break;
              case 'background':
                properties.add('background-color');
                break;
              case 'borderRadius':
                properties.add('border-radius');
                break;
              case 'sizing':
                properties.add('width');
                properties.add('height');
                break;
              case 'layout':
                properties.add('all');
                break;
            }
          });

          return Array.from(properties);
        }
      }
    `;
  }

  private static getVariantHandlerCode(): string {
    return `
      class VariantHandler {
        constructor() {
          this.variantInstances = [];
        }

        registerVariantInstances(instances) {
          this.variantInstances = instances;
        }

        findVariantInstance(nodeId) {
          return this.variantInstances.find(instance => 
            instance.variants.includes(nodeId) || instance.instanceId === nodeId
          ) || null;
        }

        findVariantInstanceByTarget(targetId) {
          return this.variantInstances.find(instance => 
            instance.variants.includes(targetId)
          ) || null;
        }

        async executeVariantAnimation(variantInstance, sourceId, targetId, sourceElement, targetElement, sourceNode, targetNode, options) {
          console.log('Executing variant animation:', sourceId, '→', targetId);

          const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
          console.log('Variant changes detected:', changes);

          switch (options.transitionType) {
            case 'SMART_ANIMATE':
              await this.executeVariantSmartAnimate(variantInstance, sourceId, targetId, sourceElement, targetElement, changes, options);
              break;
            case 'DISSOLVE':
              await this.executeVariantDissolve(variantInstance, sourceId, targetId, sourceElement, targetElement, options);
              break;
            default:
              this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
          }

          variantInstance.activeVariant = targetId;
          variantInstance.currentIndex = variantInstance.variants.indexOf(targetId);
          
          // Setup click reactions for the new active variant
          // Note: setupClickReactions is handled by the main animation system
        }

        async executeVariantSmartAnimate(variantInstance, sourceId, targetId, sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('🎬 Smart animate:', options.duration + 's');

            const layoutChange = changes.find(change => change.property === 'layout');
            if (layoutChange) {
              DOMManipulator.applyLayoutFlattening(sourceElement, layoutChange);
            }

            // Store original source element state for restoration
            const originalSourceState = this.captureElementState(sourceElement);

            DOMManipulator.setupTransitions(sourceElement, changes, options);
            DOMManipulator.setupChildTransitions(sourceElement, changes, options);

            // Apply all changes simultaneously to animate source element to target state
            console.log('🎬 Applying changes to element:', sourceElement.getAttribute('data-figma-id'));
            console.log('🎬 Applying', changes.length, 'changes simultaneously');
            
            // Apply all changes at once to ensure simultaneous animation
            changes.forEach(change => {
              console.log('🎬 Queuing change:', change.property, '=', change.targetValue);
            });
            
            // Collect all style changes and apply them simultaneously
            const styleChanges = [];
            
            changes.forEach(change => {
              console.log('🎬 Queuing change:', change.property, '=', change.targetValue);
              const styleChange = DOMManipulator.prepareChange(sourceElement, change);
              if (styleChange) {
                styleChanges.push(styleChange);
                console.log('🎬 Prepared style change:', styleChange);
              } else {
                console.log('🎬 No style change prepared for:', change.property);
              }
            });
            
            console.log('🎬 Total style changes to apply:', styleChanges.length);
            
            // Apply all style changes simultaneously in next frame
            requestAnimationFrame(() => {
              console.log('🎬 Applying', styleChanges.length, 'style changes in requestAnimationFrame');
              styleChanges.forEach((styleChange, index) => {
                console.log('🎬 Applying style change', index + 1, ':', styleChange);
                DOMManipulator.applyStyleChange(sourceElement, styleChange);
              });
            });

            setTimeout(() => {
              console.log('🎬 Smart animate complete, switching variants');
              
              // Restore source element to original state before switching
              this.restoreElementState(sourceElement, originalSourceState);
              
              this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
              resolve();
            }, options.duration * 1000);
          });
        }

        async executeVariantDissolve(variantInstance, sourceId, targetId, sourceElement, targetElement, options) {
          return new Promise((resolve) => {
            console.log('Starting variant DISSOLVE:', options.duration + 's');

            sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            
            targetElement.style.display = 'block';
            targetElement.style.opacity = '0';

            requestAnimationFrame(() => {
              sourceElement.style.opacity = '0';
              targetElement.style.opacity = '1';
            });

            setTimeout(() => {
              this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
              resolve();
            }, options.duration * 1000);
          });
        }

        captureElementState(element) {
          const state = {
            style: {
              transition: element.style.transition,
              transform: element.style.transform,
              opacity: element.style.opacity,
              backgroundColor: element.style.backgroundColor
            },
            children: []
          };
          
          // Capture child element states
          const childElements = element.querySelectorAll('[data-figma-id]');
          childElements.forEach(child => {
            state.children.push({
              id: child.getAttribute('data-figma-id'),
              style: {
                transition: child.style.transition,
                transform: child.style.transform,
                opacity: child.style.opacity,
                backgroundColor: child.style.backgroundColor,
                fill: child.style.fill
              }
            });
          });
          
          // Also capture path elements for SVG fill colors
          const pathElements = element.querySelectorAll('path');
          pathElements.forEach(path => {
            state.children.push({
              id: 'path-' + Math.random().toString(36).substr(2, 9), // Generate unique ID
              style: {
                fill: path.style.fill
              },
              isPath: true,
              element: path
            });
          });
          
          return state;
        }

        restoreElementState(element, state) {
          // Restore element style
          element.style.transition = state.style.transition;
          element.style.transform = state.style.transform;
          element.style.opacity = state.style.opacity;
          element.style.backgroundColor = state.style.backgroundColor;
          
          // Restore child element styles
          state.children.forEach(childState => {
            if (childState.isPath) {
              // Restore path element directly
              if (childState.element) {
                childState.element.style.fill = childState.style.fill;
              }
            } else {
              // Restore regular child elements
              const childElement = element.querySelector(\`[data-figma-id="\${childState.id}"]\`);
              if (childElement) {
                childElement.style.transition = childState.style.transition;
                childElement.style.transform = childState.style.transform;
                childElement.style.opacity = childState.style.opacity;
                childElement.style.backgroundColor = childState.style.backgroundColor;
                childElement.style.fill = childState.style.fill;
              }
            }
          });
        }

        performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement) {
          console.log('🔄 Variant switch:', sourceId, '→', targetId);
          
          // Log target element state BEFORE switch (simplified to avoid DOM queries)
          console.log('🔄 Target BEFORE switch:', {
            display: targetElement.style.display,
            opacity: targetElement.style.opacity
          });
          
          // Reset source element
          if (sourceElement) {
            sourceElement.style.transition = '';
            sourceElement.style.transform = '';
            sourceElement.style.opacity = '';
            
            // Reset child elements
            const sourceChildElements = sourceElement.querySelectorAll('[data-figma-id]');
            sourceChildElements.forEach(child => {
              child.style.transition = '';
              child.style.transform = '';
              child.style.opacity = '';
            });
          }
          
          // Hide all variants
          variantInstance.variants.forEach(variantId => {
            const element = document.querySelector(\`[data-figma-id="\${variantId}"]\`);
            if (element) {
              element.style.display = 'none';
            }
          });

          // Show target variant - CRITICAL: Set both display AND opacity with !important
          if (targetElement) {
            targetElement.style.setProperty('display', 'block', 'important');
            targetElement.style.setProperty('opacity', '1', 'important');
            targetElement.style.transform = '';
            
            // Log target element state AFTER switch (simplified to avoid DOM queries)
            console.log('🔄 Target AFTER switch:', {
              display: targetElement.style.display,
              opacity: targetElement.style.opacity
            });
          }
        }
      }
    `;
  }

  private static getAnimationSystemCode(): string {
    return `
      class FigmaAnimationSystem {
        constructor() {
          this.elementRegistry = new Map();
          this.nodeRegistry = new Map();
          this.timeouts = new Set();
          this.variantHandler = new VariantHandler();
          console.log('FigmaAnimationSystem initialized');
        }

        registerElement(figmaId, element, node) {
          this.elementRegistry.set(figmaId, element);
          this.nodeRegistry.set(figmaId, node);
          element.setAttribute('data-figma-id', figmaId);
          console.log('Registered element:', figmaId, node.name);
        }

        registerVariantInstances(instances) {
          this.variantHandler.registerVariantInstances(instances);
        }

        async executeAnimation(sourceId, targetId) {
          console.log('Executing animation:', sourceId, '→', targetId);
          
          // First check if source is part of a variant instance
          let variantInstance = this.variantHandler.findVariantInstance(sourceId);
          
          // If not found, check if target is a variant (for clicks from instance children to variants)
          if (!variantInstance) {
            variantInstance = this.variantHandler.findVariantInstanceByTarget(targetId);
          }
          
          if (variantInstance) {
            await this.executeVariantAnimation(variantInstance, sourceId, targetId);
            return;
          }
          
          await this.executeElementAnimation(sourceId, targetId);
        }

        async executeVariantAnimation(variantInstance, sourceId, targetId) {
          const sourceElement = this.elementRegistry.get(sourceId);
          const targetElement = this.elementRegistry.get(targetId);
          const sourceNode = this.nodeRegistry.get(sourceId);
          const targetNode = this.nodeRegistry.get(targetId);

          if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
            console.error('Missing variant elements or nodes for animation');
            return;
          }

          // Hide the instance element during variant animation to prevent double visibility
          // We only want to see the variant elements, not the instance template
          const instanceElement = this.elementRegistry.get(variantInstance.instanceId);
          if (instanceElement) {
            instanceElement.style.display = 'none';
          }

          // Determine which node to use for animation options
          // Always use the original source node for animation options (where the reaction is defined)
          let animationSourceNode = sourceNode;
          let animationSourceElement = sourceElement;
          
          // For the actual animation, we need to animate from the current active variant to the target
          let animationFromElement = sourceElement;
          let animationFromNode = sourceNode;
          
          if (!variantInstance.variants.includes(sourceId)) {
            // Source is not a variant, so we need to animate from the current active variant to the target
            const currentActiveVariantId = variantInstance.activeVariant;
            animationFromNode = this.nodeRegistry.get(currentActiveVariantId);
            animationFromElement = this.elementRegistry.get(currentActiveVariantId);
            
            if (!animationFromNode || !animationFromElement) {
              console.error('Missing current active variant for animation');
              return;
            }
          }

          const options = this.getAnimationOptions(animationSourceNode);
          if (!options) {
            console.log('No reaction found, performing instant variant switch');
            this.variantHandler.executeVariantAnimation(
              variantInstance, sourceId, targetId, sourceElement, targetElement, 
              sourceNode, targetNode, { duration: 0, easing: 'linear', transitionType: 'SMART_ANIMATE' }
            );
            return;
          }

          await this.variantHandler.executeVariantAnimation(
            variantInstance, sourceId, targetId, animationFromElement, targetElement, 
            animationFromNode, targetNode, options
          );

          this.setupTimeoutReactions(targetId);
          this.setupClickReactions(targetId);
        }

        async executeElementAnimation(sourceId, targetId) {
          const sourceElement = this.elementRegistry.get(sourceId);
          const targetElement = this.elementRegistry.get(targetId);
          const sourceNode = this.nodeRegistry.get(sourceId);
          const targetNode = this.nodeRegistry.get(targetId);

          if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
            console.error('Missing elements or nodes for animation');
            return;
          }

          const options = this.getAnimationOptions(sourceNode);
          if (!options) {
            console.log('No reaction found, performing instant switch');
            DOMManipulator.performVariantSwitch(sourceElement, targetElement);
            return;
          }

          const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
          console.log('Animation changes detected:', changes);

          switch (options.transitionType) {
            case 'SMART_ANIMATE':
              await this.executeSmartAnimate(sourceElement, targetElement, changes, options);
              break;
            case 'DISSOLVE':
              await this.executeDissolve(sourceElement, targetElement, options);
              break;
            default:
              DOMManipulator.performVariantSwitch(sourceElement, targetElement);
          }

          this.setupTimeoutReactions(targetId);
          this.setupClickReactions(targetId);
        }

        async executeSmartAnimate(sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

            DOMManipulator.setupTransitions(sourceElement, changes, options);

            // Apply changes immediately to avoid frame delay
            changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));

            setTimeout(() => {
              console.log('Animation completed, switching to target');
              DOMManipulator.performVariantSwitch(sourceElement, targetElement);
              resolve();
            }, options.duration * 1000);
          });
        }

        async executeDissolve(sourceElement, targetElement, options) {
          return new Promise((resolve) => {
            console.log('Starting DISSOLVE:', options.duration + 's');

            sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            
            targetElement.style.display = '';
            targetElement.style.opacity = '0';

            requestAnimationFrame(() => {
              sourceElement.style.opacity = '0';
              targetElement.style.opacity = '1';
            });

            setTimeout(() => {
              sourceElement.style.display = 'none';
              resolve();
            }, options.duration * 1000);
          });
        }

        getAnimationOptions(node) {
          const reaction = node.reactions && node.reactions[0];
          if (!reaction) {
            return null;
          }

          return new AnimationOptions(
            reaction.action.transition.duration,
            this.mapFigmaEasing(reaction.action.transition.easing.type),
            reaction.action.transition.type
          );
        }

        mapFigmaEasing(figmaEasing) {
          const easingMap = {
            'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
            'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
            'LINEAR': 'linear',
            'EASE_IN_AND_OUT_BACK': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
            'EASE_OUT': 'cubic-bezier(0, 0, 0.2, 1)'
          };
          return easingMap[figmaEasing] || easingMap['GENTLE'];
        }

        setupTimeoutReactions(nodeId) {
          const node = this.nodeRegistry.get(nodeId);
          if (!node || !node.reactions) return;

          node.reactions
            .filter(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
            .forEach(reaction => {
              console.log('Setting up timeout reaction:', reaction.trigger.timeout + 's delay');
              
              const timeout = setTimeout(() => {
                this.executeAnimation(nodeId, reaction.action.destinationId);
              }, (reaction.trigger.timeout || 0) * 1000);
              
              this.timeouts.add(timeout);
            });
        }

        setupClickReactions(nodeId) {
          console.log('🔍 Setting up click reactions for node:', nodeId);
          const node = this.nodeRegistry.get(nodeId);
          if (!node || !node.reactions) {
            console.log('🔍 No node or reactions found for:', nodeId);
            return;
          }

          const element = this.elementRegistry.get(nodeId);
          if (!element) {
            console.warn('Element not found for click setup:', nodeId);
            return;
          }

          node.reactions
            .filter(reaction => reaction.trigger.type === 'ON_CLICK' || reaction.trigger.type === 'ON_PRESS')
            .forEach(reaction => {
              console.log('Setting up click reaction for:', nodeId, '→', reaction.action.destinationId);
              
              // Add click event listener
              element.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('Click detected on:', nodeId, 'triggering animation to:', reaction.action.destinationId);
                this.executeAnimation(nodeId, reaction.action.destinationId);
              });
              
              // Add visual feedback for clickable elements
              element.style.cursor = 'pointer';
              element.style.userSelect = 'none';
            });
        }

        clearAllTimeouts() {
          this.timeouts.forEach(timeout => clearTimeout(timeout));
          this.timeouts.clear();
          console.log('All timeout reactions cleared');
        }

        destroy() {
          this.clearAllTimeouts();
          this.elementRegistry.clear();
          this.nodeRegistry.clear();
          console.log('FigmaAnimationSystem destroyed');
        }
      }
    `;
  }

  private static generateNodeRegistrations(nodes: FigmaNodeData[]): string {
    let registrations = '';
    
    const registerNodeRecursively = (node: FigmaNodeData) => {
      const sanitizedId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      registrations += `
        const element_${sanitizedId} = document.querySelector('[data-figma-id="${node.id}"]');
        if (element_${sanitizedId}) {
          window.figmaAnimationSystem.registerElement(
            '${node.id}',
            element_${sanitizedId},
            ${JSON.stringify(node)}
          );
        } else {
          console.warn('Element not found for node: ${node.id}');
        }
      `;
      
      // Recursively register ALL children to ensure we catch all nodes with reactions
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          registerNodeRecursively(child);
        });
      }
    };
    
    nodes.forEach(node => {
      registerNodeRecursively(node);
    });
    
    return registrations;
  }

  private static generateVariantRegistrations(resolvedInstances: any[]): string {
    let registrations = '';
    const registeredIds = new Set<string>(); // Track registered IDs to avoid duplicates
    
    resolvedInstances.forEach(instance => {
      instance.variants.forEach((variant: FigmaNodeData) => {
        const registerVariantRecursively = (node: FigmaNodeData) => {
          // Skip if already registered to avoid duplicate variable declarations
          if (registeredIds.has(node.id)) {
            return;
          }
          registeredIds.add(node.id);
          
          const sanitizedId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
          registrations += `
        const variant_${sanitizedId} = document.querySelector('[data-figma-id="${node.id}"]');
        if (variant_${sanitizedId}) {
          window.figmaAnimationSystem.registerElement(
            '${node.id}',
            variant_${sanitizedId},
            ${JSON.stringify(node)}
          );
        } else {
          console.warn('Variant element not found: ${node.id}');
        }
      `;
          
          // Recursively register ALL children to ensure we catch all nodes with reactions
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              registerVariantRecursively(child);
            });
          }
        };
        
        registerVariantRecursively(variant);
      });
    });
    
    return registrations;
  }

  private static generateInitialTimeouts(nodes: FigmaNodeData[], resolvedInstances?: any[]): string {
    // Recursively find all nodes with timeout reactions
    const allNodesWithTimeouts: FigmaNodeData[] = [];
    
    const findNodesWithTimeouts = (nodeList: FigmaNodeData[]) => {
      nodeList.forEach(node => {
        // Check if this node has timeout reactions
        if (node.reactions?.some(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')) {
          console.log('⏰ Found node with timeout reactions:', node.name, node.id, node.reactions);
          allNodesWithTimeouts.push(node);
        }
        
        // Recursively check children
        if (node.children && node.children.length > 0) {
          findNodesWithTimeouts(node.children);
        }
      });
    };
    
    findNodesWithTimeouts(nodes);
    
    // Also check resolved instances for timeout reactions
    if (resolvedInstances) {
      resolvedInstances.forEach(instance => {
        if (instance.variants) {
          findNodesWithTimeouts(instance.variants);
        }
      });
    }

    console.log('⏰ Found nodes with timeout reactions:', allNodesWithTimeouts.map(n => ({ 
      id: n.id, 
      name: n.name, 
      reactions: n.reactions?.map(r => ({ trigger: r.trigger.type, destination: r.action.destinationId }))
    })));

    return allNodesWithTimeouts.map(node => {
      // Check if this is an instance with variants
      const instanceWithVariants = resolvedInstances?.find(instance => 
        instance.instance?.id === node.id
      );
      
      if (instanceWithVariants) {
        // Use the active variant instead of the instance for timeout setup
        const activeVariantId = instanceWithVariants.activeVariant.id;
        return `
      // Setup timeout reactions for ${node.name} using active variant
      window.figmaAnimationSystem.setupTimeoutReactions('${activeVariantId}');`;
      } else {
        // Regular node without variants
        return `
      // Setup timeout reactions for ${node.name}
      window.figmaAnimationSystem.setupTimeoutReactions('${node.id}');`;
      }
    }).join('\n');
  }

  private static generateInitialClicks(nodes: FigmaNodeData[], resolvedInstances?: any[]): string {
    console.log('🔍 generateInitialClicks called with', nodes.length, 'nodes and', resolvedInstances?.length || 0, 'resolved instances');
    
    // Recursively find all nodes with click/press reactions
    const allNodesWithClicks: FigmaNodeData[] = [];
    
    const findNodesWithClicks = (nodeList: FigmaNodeData[]) => {
      nodeList.forEach(node => {
        // Check if this node has click/press reactions
        if (node.reactions?.some(reaction => 
          reaction.trigger.type === 'ON_CLICK' || reaction.trigger.type === 'ON_PRESS'
        )) {
          console.log('🔍 Found node with click/press reactions:', node.name, node.id, node.reactions);
          allNodesWithClicks.push(node);
        }
        
        // Recursively check children
        if (node.children && node.children.length > 0) {
          console.log('🔍 Checking children of', node.name, '-', node.children.length, 'children');
          findNodesWithClicks(node.children);
        }
      });
    };
    
    findNodesWithClicks(nodes);
    
    // Also check resolved instances for click reactions
    if (resolvedInstances) {
      console.log('🔍 Checking resolved instances for click reactions');
      resolvedInstances.forEach(instance => {
        if (instance.variants) {
          console.log('🔍 Checking variants of instance:', instance.instance?.name, '-', instance.variants.length, 'variants');
          findNodesWithClicks(instance.variants);
        }
      });
    }

    console.log('🔍 Found nodes with click/press reactions:', allNodesWithClicks.map(n => ({ 
      id: n.id, 
      name: n.name, 
      reactions: n.reactions?.map(r => ({ trigger: r.trigger.type, destination: r.action.destinationId }))
    })));

    return allNodesWithClicks.map(node => {
      // Check if this is an instance with variants
      const instanceWithVariants = resolvedInstances?.find(instance => 
        instance.instance?.id === node.id
      );
      
      if (instanceWithVariants) {
        // Use the active variant instead of the instance for click setup
        const activeVariantId = instanceWithVariants.activeVariant.id;
        return `
      // Setup click reactions for ${node.name} using active variant
      window.figmaAnimationSystem.setupClickReactions('${activeVariantId}');`;
      } else {
        // Regular node without variants
        return `
      // Setup click reactions for ${node.name}
      window.figmaAnimationSystem.setupClickReactions('${node.id}');`;
      }
    }).join('\n');
  }

  private static generateVariantAnimationSetup(resolvedInstances: any[]): string {
    let setup = '';
    
    resolvedInstances.forEach(instance => {
      const { instance: instanceNode, variants, activeVariant } = instance;
      
      setup += `
      // Setup variant animation for ${instanceNode.name}
      const instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')} = new VariantInstance(
        '${instanceNode.id}',
        [${variants.map((v: FigmaNodeData) => `'${v.id}'`).join(', ')}],
        '${activeVariant.id}',
        ${variants.findIndex((v: FigmaNodeData) => v.id === activeVariant.id)}
      );
      
      console.log('🎭 Registering variant instance:', instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')});
      
      // Collect all instances and register them together at the end
      window._tempVariantInstances = window._tempVariantInstances || [];
      window._tempVariantInstances.push(instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')});
      `;
    });
    
    return setup;
  }
}
