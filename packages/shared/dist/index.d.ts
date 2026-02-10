export interface W8Node {
    id: string;
    type: string;
    data: Record<string, any>;
    position: {
        x: number;
        y: number;
    };
}
export interface W8Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}
export interface WorkflowDefinition {
    nodes: W8Node[];
    edges: W8Edge[];
}
export interface TaskPayload {
    executionId: string;
    dataReference?: string;
    inlineData?: any;
}
//# sourceMappingURL=index.d.ts.map