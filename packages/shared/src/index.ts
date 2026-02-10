// O formato de um Nó que o Front envia e o Back recebe
export interface W8Node {
    id: string;
    type: string;
    data: Record<string, any>;
    position: { x: number; y: number };
}

export interface W8Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;  // Para ramificações (true/false em IfNode)
    targetHandle?: string;  // Para múltiplas entradas
}

export interface WorkflowDefinition {
    nodes: W8Node[];
    edges: W8Edge[];
}

// O Payload Inteligente (Claim-Check)
export interface TaskPayload {
    executionId: string;
    dataReference?: string; // S3 Key
    inlineData?: any;       // Pequeno JSON
}