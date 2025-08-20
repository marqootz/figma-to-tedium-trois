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
                  element.style.display = 'block';
                  element.style.opacity = '1';
                } else {
                  element.style.display = 'none';
                  element.style.opacity = '0';
                }
              }
            });
          });
          
          delete window._tempVariantInstances;
        }
        
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
          if (this.fillsAreDifferent(source.fills, target.fills)) {
            changes.push(new AnimationChange('background', source.fills, target.fills));
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
                changes.push(new AnimationChange('childPosition', { x: sourceChild.x, y: sourceChild.y }, { x: targetChild.x, y: targetChild.y }, null, childPath, sourceChild.id));
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
          }
        }

        static setupTransitions(element, changes, options) {
          const transitionProperties = this.getTransitionProperties(changes);
          element.style.transition = transitionProperties
            .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
            .join(', ');
        }

        static setupChildTransitions(element, changes, options) {
          const childChanges = changes.filter(change => 
            change.property === 'childPosition' || 
            change.property === 'childSize' || 
            change.property === 'childOpacity'
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
        }

        async executeVariantSmartAnimate(variantInstance, sourceId, targetId, sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting variant SMART_ANIMATE:', options.duration + 's', options.easing);

            const layoutChange = changes.find(change => change.property === 'layout');
            if (layoutChange) {
              DOMManipulator.applyLayoutFlattening(sourceElement, layoutChange);
            }

            DOMManipulator.setupTransitions(sourceElement, changes, options);
            DOMManipulator.setupChildTransitions(sourceElement, changes, options);

            requestAnimationFrame(() => {
              changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));
            });

            setTimeout(() => {
              console.log('Variant animation completed, switching to target');
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

        performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement) {
          console.log('Performing variant switch:', sourceId, '→', targetId);
          
          variantInstance.variants.forEach(variantId => {
            const element = document.querySelector(\`[data-figma-id="\${variantId}"]\`);
            if (element) {
              element.style.display = 'none';
            }
          });

          if (targetElement) {
            targetElement.style.display = 'block';
            targetElement.style.opacity = '1';
            targetElement.style.transform = '';
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
          
          const variantInstance = this.variantHandler.findVariantInstance(sourceId);
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

          const options = this.getAnimationOptions(sourceNode);
          if (!options) {
            console.log('No reaction found, performing instant variant switch');
            this.variantHandler.executeVariantAnimation(
              variantInstance, sourceId, targetId, sourceElement, targetElement, 
              sourceNode, targetNode, { duration: 0, easing: 'linear', transitionType: 'SMART_ANIMATE' }
            );
            return;
          }

          await this.variantHandler.executeVariantAnimation(
            variantInstance, sourceId, targetId, sourceElement, targetElement, 
            sourceNode, targetNode, options
          );

          this.setupTimeoutReactions(targetId);
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
        }

        async executeSmartAnimate(sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

            DOMManipulator.setupTransitions(sourceElement, changes, options);

            requestAnimationFrame(() => {
              changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));
            });

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
          if (!reaction) return null;

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
            'LINEAR': 'linear'
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
    return nodes.map(node => {
      const sanitizedId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      return `
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
    }).join('\n');
  }

  private static generateVariantRegistrations(resolvedInstances: any[]): string {
    let registrations = '';
    
    resolvedInstances.forEach(instance => {
      const { variants } = instance;
      
      variants.forEach((variant: FigmaNodeData) => {
        const sanitizedId = variant.id.replace(/[^a-zA-Z0-9]/g, '_');
        registrations += `
        const variant_${sanitizedId} = document.querySelector('[data-figma-id="${variant.id}"]');
        if (variant_${sanitizedId}) {
          window.figmaAnimationSystem.registerElement(
            '${variant.id}',
            variant_${sanitizedId},
            ${JSON.stringify(variant)}
          );
        } else {
          console.warn('Variant element not found: ${variant.id}');
        }
      `;
      });
    });
    
    return registrations;
  }

  private static generateInitialTimeouts(nodes: FigmaNodeData[], resolvedInstances?: any[]): string {
    const nodesWithTimeouts = nodes.filter(node => 
      node.reactions?.some(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
    );

    return nodesWithTimeouts.map(node => {
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
