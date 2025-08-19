/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/html/element-builder.ts
class ElementBuilder {
    buildElement(node) {
        const attributes = this.generateAttributes(node);
        const content = this.generateContent(node);
        const tag = this.getHTMLTag(node);
        return `<${tag}${attributes}>${content}</${tag}>`;
    }
    generateAttributes(node) {
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
    generateContent(node) {
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
    getHTMLTag(node) {
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

;// ./src/html/style-generator.ts
class StyleGenerator {
    generateStyles(node, isRoot = false) {
        const selector = `[data-figma-id="${node.id}"]`;
        const properties = this.generateCSSProperties(node, isRoot);
        let css = `${selector} {\n${properties}\n}`;
        // Generate styles for children
        if (node.children) {
            const childStyles = node.children
                .map(child => this.generateStyles(child, false))
                .join('\n\n');
            css += '\n\n' + childStyles;
        }
        return css;
    }
    generateCSSProperties(node, isRoot = false) {
        const properties = [];
        // Position and dimensions - normalize coordinates for browser viewport
        if (isRoot) {
            // Root elements should be positioned at 0,0
            properties.push(`position: absolute;`);
            properties.push(`left: 0px;`);
            properties.push(`top: 0px;`);
            properties.push(`width: ${node.width}px;`);
            properties.push(`height: ${node.height}px;`);
        }
        else {
            // Child elements use relative positioning within their parent
            properties.push(`position: absolute;`);
            properties.push(`left: ${node.x}px;`);
            properties.push(`top: ${node.y}px;`);
            properties.push(`width: ${node.width}px;`);
            properties.push(`height: ${node.height}px;`);
        }
        // Opacity
        if (node.opacity !== undefined && node.opacity !== 1) {
            properties.push(`opacity: ${node.opacity};`);
        }
        // Layout mode (for flexbox)
        if (node.layoutMode && node.layoutMode !== 'NONE') {
            properties.push(`display: flex;`);
            if (node.layoutMode === 'HORIZONTAL') {
                properties.push(`flex-direction: row;`);
            }
            else if (node.layoutMode === 'VERTICAL') {
                properties.push(`flex-direction: column;`);
            }
            // Alignment
            if (node.counterAxisAlignItems) {
                const alignMap = {
                    'MIN': 'flex-start',
                    'CENTER': 'center',
                    'MAX': 'flex-end'
                };
                properties.push(`align-items: ${alignMap[node.counterAxisAlignItems]};`);
            }
            if (node.primaryAxisAlignItems) {
                const justifyMap = {
                    'MIN': 'flex-start',
                    'CENTER': 'center',
                    'MAX': 'flex-end'
                };
                properties.push(`justify-content: ${justifyMap[node.primaryAxisAlignItems]};`);
            }
        }
        // Background fills
        if (node.fills && node.fills.length > 0) {
            const backgroundCSS = this.generateBackgroundCSS(node.fills);
            if (backgroundCSS) {
                properties.push(backgroundCSS);
            }
        }
        // Corner radius
        if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
            properties.push(`border-radius: ${node.cornerRadius}px;`);
        }
        // Component-specific styles
        if (node.type === 'COMPONENT_SET') {
            properties.push(`position: relative;`);
        }
        if (node.type === 'COMPONENT') {
            // Show the first variant by default, hide others
            // This will be overridden by the animation system
            properties.push(`display: block;`);
        }
        // Text-specific styles
        if (node.type === 'TEXT') {
            properties.push(`font-family: system-ui, -apple-system, sans-serif;`);
            properties.push(`display: flex;`);
            properties.push(`align-items: center;`);
            properties.push(`justify-content: center;`);
        }
        return properties.map(prop => `  ${prop}`).join('\n');
    }
    generateBackgroundCSS(fills) {
        const solidFill = fills.find(fill => fill.type === 'SOLID' && fill.color);
        if (solidFill === null || solidFill === void 0 ? void 0 : solidFill.color) {
            const { r, g, b } = solidFill.color;
            const alpha = solidFill.opacity || 1;
            return `background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha});`;
        }
        // TODO: Handle gradients
        return null;
    }
}

;// ./src/html/animation-handler.ts
class AnimationHandler {
    generateAnimationCode(nodes, resolvedInstances) {
        return `
      // Initialize Figma Animation System
      ${this.getAnimationSystemCode()}
      
      document.addEventListener('DOMContentLoaded', function() {
        window.figmaAnimationSystem = new FigmaAnimationSystem();
        
        // Register all nodes and elements
        ${this.generateNodeRegistrations(nodes)}
        
        // Register variant elements if we have resolved instances
        ${resolvedInstances ? this.generateVariantRegistrations(resolvedInstances) : ''}
        
        // Setup initial timeout reactions
        ${this.generateInitialTimeouts(nodes)}
        
        // Setup variant animation system
        ${resolvedInstances ? this.generateVariantAnimationSetup(resolvedInstances) : ''}
        
        console.log('Animation system initialized with ${nodes.length} nodes${resolvedInstances ? ' and ' + resolvedInstances.length + ' resolved instances' : ''}');
      });
    `;
    }
    getAnimationSystemCode() {
        // Return the complete FigmaAnimationSystem class as a string
        // This is a simplified browser-compatible version
        return `
      class FigmaAnimationSystem {
        constructor() {
          this.elementRegistry = new Map();
          this.nodeRegistry = new Map();
          this.timeouts = new Set();
          console.log('FigmaAnimationSystem initialized');
        }
        
        registerElement(figmaId, element, node) {
          this.elementRegistry.set(figmaId, element);
          this.nodeRegistry.set(figmaId, node);
          element.setAttribute('data-figma-id', figmaId);
          console.log('Registered element:', figmaId, node.name);
        }
        
        async executeAnimation(sourceId, targetId) {
          console.log('Executing animation:', sourceId, '→', targetId);
          
          // Check if this is a variant animation
          const variantInstance = this.findVariantInstance(sourceId);
          if (variantInstance) {
            await this.executeVariantAnimation(variantInstance, sourceId, targetId);
            return;
          }
          
          // Fallback to regular element animation
          const sourceElement = this.elementRegistry.get(sourceId);
          const targetElement = this.elementRegistry.get(targetId);
          const sourceNode = this.nodeRegistry.get(sourceId);
          const targetNode = this.nodeRegistry.get(targetId);

          if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
            console.error('Missing elements or nodes for animation');
            return;
          }

          // Get animation configuration
          const reaction = sourceNode.reactions && sourceNode.reactions[0];
          if (!reaction) {
            console.log('No reaction found, performing instant switch');
            this.performInstantSwitch(sourceElement, targetElement);
            return;
          }

          const options = {
            duration: reaction.action.transition.duration,
            easing: this.mapFigmaEasing(reaction.action.transition.easing.type),
            transitionType: reaction.action.transition.type
          };

          // Detect changes
          const changes = this.detectChanges(sourceNode, targetNode);
          console.log('Animation changes detected:', changes);

          // Execute animation
          switch (options.transitionType) {
            case 'SMART_ANIMATE':
              await this.executeSmartAnimate(sourceElement, targetElement, changes, options);
              break;
            case 'DISSOLVE':
              await this.executeDissolve(sourceElement, targetElement, options);
              break;
            default:
              this.performInstantSwitch(sourceElement, targetElement);
          }

          // Setup timeout reactions for new active variant
          this.setupTimeoutReactions(targetId);
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
        
        detectChanges(source, target) {
          const changes = [];

          // Position changes (critical for countdown animation)
          if (source.y !== target.y) {
            changes.push({
              property: 'translateY',
              sourceValue: source.y,
              targetValue: target.y,
              delta: target.y - source.y
            });
          }

          if (source.x !== target.x) {
            changes.push({
              property: 'translateX',
              sourceValue: source.x,
              targetValue: target.x,
              delta: target.x - source.x
            });
          }

          // Alignment changes (critical for countdown)
          if (source.counterAxisAlignItems !== target.counterAxisAlignItems) {
            changes.push({
              property: 'alignment',
              sourceValue: source.counterAxisAlignItems,
              targetValue: target.counterAxisAlignItems
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

          return changes;
        }
        
        async executeSmartAnimate(sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

            // Setup CSS transitions
            const properties = this.getTransitionProperties(changes);
            sourceElement.style.transition = properties
              .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
              .join(', ');

            // Apply changes on next frame
            requestAnimationFrame(() => {
              changes.forEach(change => this.applyChange(sourceElement, change));
            });

            // Complete animation
            setTimeout(() => {
              console.log('Animation completed, switching to target');
              this.performInstantSwitch(sourceElement, targetElement);
              resolve();
            }, options.duration * 1000);
          });
        }
        
        async executeDissolve(sourceElement, targetElement, options) {
          return new Promise((resolve) => {
            console.log('Starting DISSOLVE:', options.duration + 's');

            sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            
            // Show target with 0 opacity
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
        
        getTransitionProperties(changes) {
          const properties = new Set();
          
          changes.forEach(change => {
            switch (change.property) {
              case 'translateX':
              case 'translateY':
                properties.add('transform');
                break;
              case 'alignment':
                properties.add('align-items');
                break;
              default:
                properties.add(change.property);
            }
          });

          return Array.from(properties);
        }
        
        applyChange(element, change) {
          console.log('Applying change:', change.property, '=', change.targetValue);

          switch (change.property) {
            case 'translateY':
              element.style.transform = 'translateY(' + change.delta + 'px)';
              break;
            case 'translateX':
              element.style.transform = 'translateX(' + change.delta + 'px)';
              break;
            case 'alignment':
              const parent = element.parentElement;
              if (parent) {
                const alignMap = { 'MIN': 'flex-start', 'CENTER': 'center', 'MAX': 'flex-end' };
                parent.style.alignItems = alignMap[change.targetValue] || 'center';
              }
              break;
            case 'opacity':
              element.style.opacity = change.targetValue.toString();
              break;
          }
        }
        
        performInstantSwitch(sourceElement, targetElement) {
          console.log('Performing instant variant switch');
          
          // Hide all variants in the component set
          const componentSet = sourceElement.closest('[data-component-set]');
          if (componentSet) {
            const variants = componentSet.querySelectorAll('[data-variant]');
            variants.forEach(variant => {
              variant.style.display = 'none';
            });
          }

          // Show target variant
          targetElement.style.display = '';
          targetElement.style.opacity = '1';
          targetElement.style.transform = '';
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
        
        // Variant Animation Methods
        findVariantInstance(nodeId) {
          if (!this.variantInstances) return null;
          return this.variantInstances.find(instance => 
            instance.variants.includes(nodeId)
          );
        }
        
        async executeVariantAnimation(variantInstance, sourceId, targetId) {
          console.log('Executing variant animation:', sourceId, '→', targetId);
          
          const sourceElement = this.elementRegistry.get(sourceId);
          const targetElement = this.elementRegistry.get(targetId);
          const sourceNode = this.nodeRegistry.get(sourceId);
          const targetNode = this.nodeRegistry.get(targetId);

          if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
            console.error('Missing variant elements or nodes for animation');
            return;
          }

          // Get animation configuration from the source node
          const reaction = sourceNode.reactions && sourceNode.reactions[0];
          if (!reaction) {
            console.log('No reaction found, performing instant variant switch');
            this.performVariantSwitch(variantInstance, sourceId, targetId);
            return;
          }

          const options = {
            duration: reaction.action.transition.duration,
            easing: this.mapFigmaEasing(reaction.action.transition.easing.type),
            transitionType: reaction.action.transition.type
          };

          // Detect comprehensive changes between variants
          const changes = this.detectVariantChanges(sourceNode, targetNode);
          console.log('Variant changes detected:', changes);

          // Execute variant animation
          switch (options.transitionType) {
            case 'SMART_ANIMATE':
              await this.executeVariantSmartAnimate(variantInstance, sourceId, targetId, changes, options);
              break;
            case 'DISSOLVE':
              await this.executeVariantDissolve(variantInstance, sourceId, targetId, options);
              break;
            default:
              this.performVariantSwitch(variantInstance, sourceId, targetId);
          }

          // Update variant instance state
          variantInstance.activeVariant = targetId;
          variantInstance.currentIndex = variantInstance.variants.indexOf(targetId);

          // Setup timeout reactions for new active variant
          this.setupTimeoutReactions(targetId);
        }
        
        detectVariantChanges(source, target) {
          const changes = [];

          // Position and size changes
          if (source.x !== target.x || source.y !== target.y) {
            changes.push({
              property: 'position',
              sourceValue: { x: source.x, y: source.y },
              targetValue: { x: target.x, y: target.y }
            });
          }

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

          // Layout changes (for hybrid flattening)
          if (this.layoutHasChanged(source, target)) {
            changes.push({
              property: 'layout',
              sourceValue: this.getLayoutProperties(source),
              targetValue: this.getLayoutProperties(target)
            });
          }

          return changes;
        }
        
        fillsAreDifferent(sourceFills, targetFills) {
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
        
        layoutHasChanged(source, target) {
          return source.layoutMode !== target.layoutMode ||
                 source.counterAxisAlignItems !== target.counterAxisAlignItems ||
                 source.primaryAxisAlignItems !== target.primaryAxisAlignItems ||
                 source.itemSpacing !== target.itemSpacing ||
                 source.paddingLeft !== target.paddingLeft ||
                 source.paddingRight !== target.paddingRight ||
                 source.paddingTop !== target.paddingTop ||
                 source.paddingBottom !== target.paddingBottom;
        }
        
        getLayoutProperties(node) {
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
        
        async executeVariantSmartAnimate(variantInstance, sourceId, targetId, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting variant SMART_ANIMATE:', options.duration + 's', options.easing);

            const sourceElement = this.elementRegistry.get(sourceId);
            const targetElement = this.elementRegistry.get(targetId);

            // Apply hybrid flattening if layout changes detected
            const layoutChange = changes.find(change => change.property === 'layout');
            if (layoutChange) {
              this.applyLayoutFlattening(sourceElement, layoutChange);
            }

            // Setup CSS transitions for all changing properties
            const transitionProperties = this.getVariantTransitionProperties(changes);
            sourceElement.style.transition = transitionProperties
              .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
              .join(', ');

            // Apply changes on next frame
            requestAnimationFrame(() => {
              changes.forEach(change => this.applyVariantChange(sourceElement, change));
            });

            // Complete animation
            setTimeout(() => {
              console.log('Variant animation completed, switching to target');
              this.performVariantSwitch(variantInstance, sourceId, targetId);
              resolve();
            }, options.duration * 1000);
          });
        }
        
        applyLayoutFlattening(element, layoutChange) {
          // Convert flexbox layout to absolute positioning for animation
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
        
        getVariantTransitionProperties(changes) {
          const properties = new Set();
          
          changes.forEach(change => {
            switch (change.property) {
              case 'position':
              case 'size':
                properties.add('transform');
                break;
              case 'opacity':
                properties.add('opacity');
                break;
              case 'background':
                properties.add('background-color');
                break;
              case 'borderRadius':
                properties.add('border-radius');
                break;
              case 'layout':
                properties.add('all');
                break;
            }
          });

          return Array.from(properties);
        }
        
        applyVariantChange(element, change) {
          console.log('Applying variant change:', change.property, '=', change.targetValue);

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
            case 'layout':
              // Layout changes are handled by flattening
              break;
          }
        }
        
        async executeVariantDissolve(variantInstance, sourceId, targetId, options) {
          return new Promise((resolve) => {
            console.log('Starting variant DISSOLVE:', options.duration + 's');

            const sourceElement = this.elementRegistry.get(sourceId);
            const targetElement = this.elementRegistry.get(targetId);

            sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
            
            // Show target with 0 opacity
            targetElement.style.display = 'block';
            targetElement.style.opacity = '0';

            requestAnimationFrame(() => {
              sourceElement.style.opacity = '0';
              targetElement.style.opacity = '1';
            });

            setTimeout(() => {
              this.performVariantSwitch(variantInstance, sourceId, targetId);
              resolve();
            }, options.duration * 1000);
          });
        }
        
        performVariantSwitch(variantInstance, sourceId, targetId) {
          console.log('Performing variant switch:', sourceId, '→', targetId);
          
          // Hide all variants in the instance
          variantInstance.variants.forEach(variantId => {
            const element = this.elementRegistry.get(variantId);
            if (element) {
              element.style.display = 'none';
            }
          });

          // Show target variant
          const targetElement = this.elementRegistry.get(targetId);
          if (targetElement) {
            targetElement.style.display = 'block';
            targetElement.style.opacity = '1';
            targetElement.style.transform = '';
          }
        }
      }
    `;
    }
    generateNodeRegistrations(nodes) {
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
    generateInitialTimeouts(nodes) {
        const nodesWithTimeouts = nodes.filter(node => { var _a; return (_a = node.reactions) === null || _a === void 0 ? void 0 : _a.some(reaction => reaction.trigger.type === 'AFTER_TIMEOUT'); });
        return nodesWithTimeouts.map(node => `
      // Setup timeout reactions for ${node.name}
      window.figmaAnimationSystem.setupTimeoutReactions('${node.id}');
    `).join('\n');
    }
    // Generate registrations for variant elements
    generateVariantRegistrations(resolvedInstances) {
        let registrations = '';
        resolvedInstances.forEach(instance => {
            const { variants } = instance;
            variants.forEach((variant) => {
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
    // Generate variant animation setup
    generateVariantAnimationSetup(resolvedInstances) {
        let setup = '';
        resolvedInstances.forEach(instance => {
            const { instance: instanceNode, variants, activeVariant } = instance;
            setup += `
      // Setup variant animation for ${instanceNode.name}
      const instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')} = {
        instanceId: '${instanceNode.id}',
        variants: [${variants.map((v) => `'${v.id}'`).join(', ')}],
        activeVariant: '${activeVariant.id}',
        currentIndex: ${variants.findIndex((v) => v.id === activeVariant.id)}
      };
      
      // Add variant switching methods to animation system
      window.figmaAnimationSystem.variantInstances = window.figmaAnimationSystem.variantInstances || [];
      window.figmaAnimationSystem.variantInstances.push(instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')});
      `;
        });
        return setup;
    }
}

;// ./src/html/generator.ts



class HTMLGenerator {
    constructor() {
        this.elementBuilder = new ElementBuilder();
        this.styleGenerator = new StyleGenerator();
        this.animationHandler = new AnimationHandler();
    }
    generateHTML(nodes, resolvedInstances) {
        const css = this.generateCSS(nodes, resolvedInstances);
        const bodyHTML = this.generateBodyHTML(nodes, resolvedInstances);
        const javascript = this.generateJavaScript(nodes, resolvedInstances);
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Export</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f5f5f5;
      overflow: hidden;
      margin: 0;
    }
    
    /* Component styles */
${css}
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    ${javascript}
  </script>
</body>
</html>`;
    }
    generateCSS(nodes, resolvedInstances) {
        let css = nodes.map(node => this.styleGenerator.generateStyles(node, true)).join('\n\n');
        // Add CSS for all variants if we have resolved instances
        if (resolvedInstances) {
            const variantCSS = this.generateVariantCSS(resolvedInstances);
            css += '\n\n' + variantCSS;
        }
        return css;
    }
    generateBodyHTML(nodes, resolvedInstances) {
        let html = nodes.map(node => this.elementBuilder.buildElement(node)).join('\n');
        // Add HTML for all variants if we have resolved instances
        if (resolvedInstances) {
            const variantHTML = this.generateVariantHTML(resolvedInstances);
            html += '\n' + variantHTML;
        }
        return html;
    }
    generateJavaScript(nodes, resolvedInstances) {
        return this.animationHandler.generateAnimationCode(nodes, resolvedInstances);
    }
    // Generate CSS for all variants in the shadow variant system
    generateVariantCSS(resolvedInstances) {
        let css = '';
        resolvedInstances.forEach(instance => {
            const { variants, activeVariant } = instance;
            // Generate CSS for each variant
            variants.forEach((variant) => {
                const variantCSS = this.styleGenerator.generateStyles(variant, false);
                css += '\n\n' + variantCSS;
                // Add variant-specific visibility rules
                const isActive = variant.id === activeVariant.id;
                css += `\n[data-figma-id="${variant.id}"] {\n`;
                css += `  display: ${isActive ? 'block' : 'none'};\n`;
                css += `  position: absolute;\n`;
                css += `  left: 0;\n`;
                css += `  top: 0;\n`;
                css += `}\n`;
            });
        });
        return css;
    }
    // Generate HTML for all variants in the shadow variant system
    generateVariantHTML(resolvedInstances) {
        let html = '';
        resolvedInstances.forEach(instance => {
            const { instance: instanceNode, variants } = instance;
            // Create a container for all variants
            html += `\n<!-- Variants for ${instanceNode.name} -->\n`;
            html += `<div class="variant-container" data-instance-id="${instanceNode.id}">\n`;
            // Generate HTML for each variant
            variants.forEach((variant) => {
                const variantHTML = this.elementBuilder.buildElement(variant);
                html += variantHTML + '\n';
            });
            html += `</div>\n`;
        });
        return html;
    }
}

;// ./src/plugin/figma-data-extractor.ts
class FigmaDataExtractor {
    async extractNodes(selection) {
        console.log('Extracting data from', selection.length, 'selected nodes');
        if (selection.length === 0) {
            throw new Error('Please select at least one node to export');
        }
        const extractedNodes = [];
        for (const node of selection) {
            const figmaNode = await this.extractNode(node);
            extractedNodes.push(figmaNode);
        }
        console.log('Extracted', extractedNodes.length, 'nodes with animation data');
        return extractedNodes;
    }
    async extractNode(node) {
        const baseNode = {
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
            baseNode.counterAxisAlignItems = node.counterAxisAlignItems;
        }
        if ('primaryAxisAlignItems' in node) {
            baseNode.primaryAxisAlignItems = node.primaryAxisAlignItems;
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
    extractFills(fills) {
        return fills
            .filter((fill) => fill.type === 'SOLID' || fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL')
            .map(fill => {
            const figmaFill = {
                type: fill.type,
                opacity: fill.opacity
            };
            if (fill.type === 'SOLID') {
                figmaFill.color = this.extractColor(fill.color);
            }
            else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
                figmaFill.gradientStops = fill.gradientStops.map(stop => ({
                    position: stop.position,
                    color: this.extractColor(stop.color)
                }));
            }
            return figmaFill;
        });
    }
    extractColor(color) {
        return {
            r: color.r,
            g: color.g,
            b: color.b
        };
    }
    extractReactions(reactions) {
        return reactions
            .filter((reaction) => reaction.action && reaction.action.type === 'NODE')
            .map(reaction => {
            var _a, _b, _c, _d;
            const figmaReaction = {
                trigger: {
                    type: reaction.trigger.type
                },
                action: {
                    type: 'NODE',
                    destinationId: reaction.action.destinationId || '',
                    navigation: 'CHANGE_TO',
                    transition: {
                        type: ((_a = reaction.action.transition) === null || _a === void 0 ? void 0 : _a.type) || 'SMART_ANIMATE',
                        easing: {
                            type: ((_c = (_b = reaction.action.transition) === null || _b === void 0 ? void 0 : _b.easing) === null || _c === void 0 ? void 0 : _c.type) || 'GENTLE'
                        },
                        duration: ((_d = reaction.action.transition) === null || _d === void 0 ? void 0 : _d.duration) || 0.3
                    }
                }
            };
            // Extract timeout value for AFTER_TIMEOUT triggers
            if (reaction.trigger.type === 'AFTER_TIMEOUT' && 'timeout' in reaction.trigger) {
                figmaReaction.trigger.timeout = reaction.trigger.timeout;
            }
            return figmaReaction;
        });
    }
    // Helper method to find component sets and their variants
    findComponentSets(nodes) {
        const componentSets = [];
        nodes.forEach(node => {
            var _a;
            if (node.type === 'COMPONENT_SET') {
                const variants = ((_a = node.children) === null || _a === void 0 ? void 0 : _a.filter(child => child.type === 'COMPONENT')) || [];
                componentSets.push({
                    componentSet: node,
                    variants: variants
                });
            }
        });
        return componentSets;
    }
    // Enhanced method to resolve instances and find their component sets
    async resolveInstancesAndComponentSets(nodes) {
        const resolvedInstances = [];
        for (const node of nodes) {
            if (node.type === 'INSTANCE' && node.mainComponentId) {
                try {
                    const resolved = await this.resolveInstance(node);
                    if (resolved) {
                        resolvedInstances.push(resolved);
                    }
                }
                catch (error) {
                    console.warn('Failed to resolve instance:', node.id, error);
                }
            }
        }
        return resolvedInstances;
    }
    // Resolve a single instance to its component set and variants
    async resolveInstance(instance) {
        if (!instance.mainComponentId) {
            return null;
        }
        try {
            // Get the main component from Figma
            const mainComponent = figma.getNodeById(instance.mainComponentId);
            if (!mainComponent) {
                console.warn('Main component not found:', instance.mainComponentId);
                return null;
            }
            // Find the parent component set
            const componentSet = mainComponent.parent;
            if (!componentSet || componentSet.type !== 'COMPONENT_SET') {
                console.warn('Component set not found for main component:', instance.mainComponentId);
                return null;
            }
            // Extract all variants from the component set
            const variants = [];
            for (const variant of componentSet.children) {
                if (variant.type === 'COMPONENT') {
                    const variantNode = await this.extractNode(variant);
                    variants.push(variantNode);
                }
            }
            // Find the active variant based on instance properties
            const activeVariant = this.findActiveVariant(instance, variants);
            if (!activeVariant) {
                console.warn('Active variant not found for instance:', instance.id);
                return null;
            }
            // Extract the component set and main component
            const componentSetNode = await this.extractNode(componentSet);
            const mainComponentNode = await this.extractNode(mainComponent);
            return {
                instance,
                mainComponent: mainComponentNode,
                componentSet: componentSetNode,
                variants,
                activeVariant
            };
        }
        catch (error) {
            console.error('Error resolving instance:', instance.id, error);
            return null;
        }
    }
    // Find the active variant based on instance variant properties
    findActiveVariant(instance, variants) {
        if (!instance.variantProperties) {
            // If no variant properties, return the first variant
            return variants[0] || null;
        }
        // Find variant that matches the instance's variant properties
        for (const variant of variants) {
            if (this.variantPropertiesMatch(instance.variantProperties, variant.variantProperties)) {
                return variant;
            }
        }
        // If no exact match, return the first variant
        return variants[0] || null;
    }
    // Check if variant properties match
    variantPropertiesMatch(instanceProps, variantProps) {
        if (!instanceProps || !variantProps) {
            return false;
        }
        for (const [key, value] of Object.entries(instanceProps)) {
            if (variantProps[key] !== value) {
                return false;
            }
        }
        return true;
    }
    // Helper method to trace animation chains
    traceAnimationChain(startNodeId, nodes) {
        const chain = [startNodeId];
        const visited = new Set();
        let currentId = startNodeId;
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const currentNode = nodes.find(n => n.id === currentId);
            if (!(currentNode === null || currentNode === void 0 ? void 0 : currentNode.reactions))
                break;
            const timeoutReaction = currentNode.reactions.find(r => r.trigger.type === 'AFTER_TIMEOUT');
            if (!timeoutReaction)
                break;
            currentId = timeoutReaction.action.destinationId;
            if (currentId && !chain.includes(currentId)) {
                chain.push(currentId);
            }
            else {
                break; // Avoid infinite loops
            }
        }
        return chain;
    }
}

;// ./src/plugin/main.ts


// Plugin entry point
figma.showUI(__html__, { width: 400, height: 500 });
figma.ui.onmessage = async (msg) => {
    try {
        switch (msg.type) {
            case 'export-html':
                await handleExportHTML();
                break;
            case 'export-json':
                await handleExportJSON();
                break;
            case 'export-both':
                await handleExportBoth();
                break;
            case 'analyze-selection':
                await handleAnalyzeSelection();
                break;
            case 'close-plugin':
                figma.closePlugin();
                break;
            case 'test':
                // Handle test message for debugging
                figma.ui.postMessage({
                    type: 'test-response',
                    message: 'Test message received successfully!',
                    timestamp: new Date().toISOString(),
                    success: true
                });
                break;
            default:
                console.warn('Unknown message type:', msg.type);
        }
    }
    catch (error) {
        console.error('Plugin error:', error);
        figma.ui.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            success: false
        });
    }
};
async function handleExportHTML() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Please select at least one component or frame to export',
            success: false
        });
        return;
    }
    console.log('Starting HTML export for', selection.length, 'selected nodes');
    // Extract Figma data
    const extractor = new FigmaDataExtractor();
    const nodes = await extractor.extractNodes(selection);
    // Resolve instances and find component sets
    const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes);
    // Analyze the structure
    const componentSets = extractor.findComponentSets(nodes);
    const animationChains = resolvedInstances.map(instance => {
        const firstVariant = instance.variants[0];
        return firstVariant ? extractor.traceAnimationChain(firstVariant.id, nodes) : [];
    });
    console.log('Found', componentSets.length, 'component sets with animations');
    console.log('Animation chains:', animationChains);
    // Generate HTML
    const generator = new HTMLGenerator();
    const html = generator.generateHTML(nodes, resolvedInstances);
    // Send back to UI
    figma.ui.postMessage({
        type: 'html-generated',
        html: html,
        metadata: {
            nodeCount: nodes.length,
            componentSets: componentSets.length,
            animationChains: animationChains.length
        },
        success: true
    });
    console.log('HTML export completed successfully');
}
async function handleExportJSON() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Please select at least one component or frame to export',
            success: false
        });
        return;
    }
    console.log('Starting JSON export for', selection.length, 'selected nodes');
    // Extract Figma data
    const extractor = new FigmaDataExtractor();
    const nodes = await extractor.extractNodes(selection);
    // Resolve instances and find component sets
    const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes);
    // Create comprehensive export data
    const exportData = {
        meta: {
            exportedAt: new Date().toISOString(),
            figmaFileKey: figma.fileKey || 'unknown',
            figmaFileName: figma.root.name || 'Untitled',
            nodeCount: nodes.length,
            pluginVersion: '1.0.0'
        },
        nodes: nodes,
        componentSets: extractor.findComponentSets(nodes),
        resolvedInstances: resolvedInstances,
        animationChains: resolvedInstances.map(instance => {
            const firstVariant = instance.variants[0];
            return firstVariant ? extractor.traceAnimationChain(firstVariant.id, nodes) : [];
        })
    };
    // Send JSON back to UI
    figma.ui.postMessage({
        type: 'json-generated',
        json: JSON.stringify(exportData, null, 2),
        data: exportData,
        metadata: {
            nodeCount: nodes.length,
            componentSets: exportData.componentSets.length,
            animationChains: exportData.animationChains.length
        },
        success: true
    });
    console.log('JSON export completed successfully');
}
async function handleExportBoth() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Please select at least one component or frame to export',
            success: false
        });
        return;
    }
    console.log('Starting JSON + HTML export for', selection.length, 'selected nodes');
    // Extract Figma data
    const extractor = new FigmaDataExtractor();
    const nodes = await extractor.extractNodes(selection);
    // Resolve instances and find component sets
    const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes);
    // Analyze the structure
    const componentSets = extractor.findComponentSets(nodes);
    const animationChains = resolvedInstances.map(instance => {
        const firstVariant = instance.variants[0];
        return firstVariant ? extractor.traceAnimationChain(firstVariant.id, nodes) : [];
    });
    // Generate HTML
    const generator = new HTMLGenerator();
    const html = generator.generateHTML(nodes, resolvedInstances);
    // Create comprehensive export data
    const exportData = {
        meta: {
            exportedAt: new Date().toISOString(),
            figmaFileKey: figma.fileKey || 'unknown',
            figmaFileName: figma.root.name || 'Untitled',
            nodeCount: nodes.length,
            pluginVersion: '1.0.0'
        },
        nodes: nodes,
        componentSets: componentSets,
        resolvedInstances: resolvedInstances,
        animationChains: animationChains
    };
    // Send both JSON and HTML back to UI
    figma.ui.postMessage({
        type: 'both-generated',
        json: JSON.stringify(exportData, null, 2),
        html: html,
        data: exportData,
        metadata: {
            nodeCount: nodes.length,
            componentSets: componentSets.length,
            animationChains: animationChains.length
        },
        success: true
    });
    console.log('JSON + HTML export completed successfully');
}
async function handleAnalyzeSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'analysis-result',
            message: 'No nodes selected',
            data: null,
            success: false
        });
        return;
    }
    const extractor = new FigmaDataExtractor();
    const nodes = await extractor.extractNodes(selection);
    // Analyze the selection
    const analysis = {
        totalNodes: nodes.length,
        nodeTypes: {},
        componentSets: 0,
        components: 0,
        nodesWithReactions: 0,
        timeoutReactions: 0,
        animationChains: []
    };
    // Count node types and reactions
    nodes.forEach(node => {
        analysis.nodeTypes[node.type] = (analysis.nodeTypes[node.type] || 0) + 1;
        if (node.type === 'COMPONENT_SET') {
            analysis.componentSets++;
        }
        else if (node.type === 'COMPONENT') {
            analysis.components++;
        }
        if (node.reactions && node.reactions.length > 0) {
            analysis.nodesWithReactions++;
            const timeoutReactions = node.reactions.filter(r => r.trigger.type === 'AFTER_TIMEOUT');
            analysis.timeoutReactions += timeoutReactions.length;
        }
    });
    // Find animation chains
    const componentSets = extractor.findComponentSets(nodes);
    componentSets.forEach(cs => {
        cs.variants.forEach(variant => {
            const chain = extractor.traceAnimationChain(variant.id, nodes);
            if (chain.length > 1) {
                analysis.animationChains.push(chain);
            }
        });
    });
    figma.ui.postMessage({
        type: 'analysis-result',
        message: 'Analysis completed',
        data: analysis,
        success: true
    });
    console.log('Selection analysis:', analysis);
}
// Initialize plugin
console.log('Figma Animation Plugin initialized');
figma.ui.postMessage({
    type: 'plugin-ready',
    message: 'Plugin loaded successfully',
    success: true
});

/******/ })()
;