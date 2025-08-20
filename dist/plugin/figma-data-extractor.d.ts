/// <reference types="figma" />
import { FigmaNode } from '../core/types';
export declare class FigmaDataExtractor {
    extractNodes(selection: readonly SceneNode[]): Promise<FigmaNode[]>;
    private extractNode;
    private extractFills;
    private extractStrokes;
    private extractStrokeWeight;
    private extractCornerRadius;
    private extractLayoutMode;
    private extractCounterAxisAlignItems;
    private extractPrimaryAxisAlignItems;
    private extractItemSpacing;
    private extractPaddingLeft;
    private extractPaddingRight;
    private extractPaddingTop;
    private extractPaddingBottom;
    private extractLayoutSizingHorizontal;
    private extractLayoutSizingVertical;
    private extractOverflow;
    private extractCharacters;
    private extractFontName;
    private extractFontFamily;
    private extractFontSize;
    private extractFontWeight;
    private extractTextAlignHorizontal;
    private extractTextAlignVertical;
    private extractLetterSpacing;
    private extractLineHeight;
    private extractComponentProperties;
    private extractMainComponentId;
    private extractVariantProperties;
    private extractReactions;
    private extractVectorPaths;
    private extractEffects;
    private extractColor;
    resolveInstancesAndComponentSets(nodes: FigmaNode[]): Promise<{
        instance: FigmaNode;
        mainComponent: FigmaNode;
        componentSet: FigmaNode;
        variants: FigmaNode[];
        activeVariant: FigmaNode;
    }[]>;
    resolveInstancesFromSelection(selection: readonly SceneNode[]): Promise<{
        instance: FigmaNode;
        mainComponent: FigmaNode;
        componentSet: FigmaNode;
        variants: FigmaNode[];
        activeVariant: FigmaNode;
    }[]>;
    private resolveInstance;
    private resolveInstanceFromSelection;
    private findActiveVariantFromInstance;
    private findActiveVariant;
    private variantPropertiesMatch;
    findComponentSets(nodes: FigmaNode[]): FigmaNode[];
    traceAnimationChain(startNodeId: string, nodes: FigmaNode[]): string[];
    private propagateSizingProperties;
    private propagateChildDimensions;
}
//# sourceMappingURL=figma-data-extractor.d.ts.map