/// <reference types="figma" />
import { FigmaNode } from '../core/types';
export declare class FigmaDataExtractor {
    extractNodes(selection: readonly SceneNode[]): Promise<FigmaNode[]>;
    private extractNode;
    private extractFills;
    private extractColor;
    private extractReactions;
    findComponentSets(nodes: FigmaNode[]): {
        componentSet: FigmaNode;
        variants: FigmaNode[];
    }[];
    traceAnimationChain(startNodeId: string, nodes: FigmaNode[]): string[];
}
//# sourceMappingURL=figma-data-extractor.d.ts.map