import { FigmaNode } from '../core/types';
export declare class StyleGenerator {
    generateStyles(node: FigmaNode, isRoot?: boolean): string;
    private generateCSSProperties;
    private generateBackgroundCSS;
    private adjustLayoutDrivenPosition;
    private hasAbsolutelyPositionedChildren;
    private getChildWidthForHugSizing;
}
//# sourceMappingURL=style-generator.d.ts.map