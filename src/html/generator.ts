import { FigmaNode } from '../core/types';
import { ElementBuilder } from './element-builder';
import { StyleGenerator } from './style-generator';
import { AnimationHandler } from './animation-handler';

export class HTMLGenerator {
  private elementBuilder = new ElementBuilder();
  private styleGenerator = new StyleGenerator();
  private animationHandler = new AnimationHandler();

  generateHTML(nodes: FigmaNode[]): string {
    const css = this.generateCSS(nodes);
    const bodyHTML = this.generateBodyHTML(nodes);
    const javascript = this.generateJavaScript(nodes);

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

  private generateCSS(nodes: FigmaNode[]): string {
    return nodes.map(node => this.styleGenerator.generateStyles(node, true)).join('\n\n');
  }

  private generateBodyHTML(nodes: FigmaNode[]): string {
    return nodes.map(node => this.elementBuilder.buildElement(node)).join('\n');
  }

  private generateJavaScript(nodes: FigmaNode[]): string {
    return this.animationHandler.generateAnimationCode(nodes);
  }
}


