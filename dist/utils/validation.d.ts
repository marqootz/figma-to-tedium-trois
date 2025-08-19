import { FigmaNode, FigmaReaction } from '../core/types';
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class DataValidator {
    static validateFigmaNode(node: any): FigmaNode;
    static validateReactions(reactions: any[]): FigmaReaction[];
    static validateAnimationChain(chain: string[], nodes: FigmaNode[]): boolean;
    static validateComponentSet(componentSet: FigmaNode): void;
}
//# sourceMappingURL=validation.d.ts.map