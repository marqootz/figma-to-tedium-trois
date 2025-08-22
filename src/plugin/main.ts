import { HTMLGenerator } from '../html/generator';
import { FigmaDataExtractor } from './figma-data-extractor';

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
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    });
  }
};

async function handleExportHTML(): Promise<void> {
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
  const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes, selection);
  
  // Analyze the structure
  const componentSets = extractor.findComponentSets(nodes);
  const animationChains = resolvedInstances.map(instance => {
    const firstVariant = instance.variants[0];
    return firstVariant ? extractor.traceAnimationChain(firstVariant.id, nodes) : [];
  });



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

async function handleExportJSON(): Promise<void> {
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
  const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes, selection);
  
  // Create comprehensive export data
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      figmaFileKey: (figma as any).fileKey || 'unknown',
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

async function handleExportBoth(): Promise<void> {
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
  const resolvedInstances = await extractor.resolveInstancesAndComponentSets(nodes, selection);
  
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
      figmaFileKey: (figma as any).fileKey || 'unknown',
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

async function handleAnalyzeSelection(): Promise<void> {
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
    nodeTypes: {} as Record<string, number>,
    componentSets: 0,
    components: 0,
    nodesWithReactions: 0,
    timeoutReactions: 0,
    animationChains: [] as string[][]
  };

  // Count node types and reactions
  nodes.forEach(node => {
    analysis.nodeTypes[node.type] = (analysis.nodeTypes[node.type] || 0) + 1;
    
    if (node.type === 'COMPONENT_SET') {
      analysis.componentSets++;
    } else if (node.type === 'COMPONENT') {
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
    if (cs.children) {
      cs.children.forEach(child => {
        if (child.type === 'COMPONENT') {
          const chain = extractor.traceAnimationChain(child.id, nodes);
          if (chain.length > 1) {
            analysis.animationChains.push(chain);
          }
        }
      });
    }
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
console.log('🎉 Figma Animation Plugin initialized - LATEST CODE VERSION');
figma.ui.postMessage({
  type: 'plugin-ready',
  message: 'Plugin loaded successfully',
  success: true
});


