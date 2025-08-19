// Ultra-simple test plugin
console.log('Plugin loading...');

// Simple UI
var uiHTML = '<div><h1>Test Plugin</h1><button onclick="parent.postMessage({pluginMessage: {type: \'test\'}}, \'*\')">Test</button></div>';

figma.showUI(uiHTML, { width: 300, height: 200 });

figma.ui.onmessage = function(msg) {
  console.log('Message received:', msg);
  if (msg.type === 'test') {
    figma.ui.postMessage({
      type: 'success',
      message: 'Plugin is working!'
    });
  }
};

console.log('Plugin loaded successfully');


