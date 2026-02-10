"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rota para receber o desenho do Frontend
app.post('/api/workflows/execute', (req, res) => {
    const workflow = req.body;
    console.log(`🚀 Recebido workflow com ${workflow.nodes.length} nós.`);
    // AQUI É ONDE A MÁGICA VAI ACONTECER DEPOIS (Integração Trigger.dev)
    // Por enquanto, só fingimos que aceitamos.
    res.json({
        success: true,
        executionId: "exec_" + Date.now(),
        message: "Workflow enviado para a fila (Mentira, por enquanto só logou)"
    });
});
app.get('/', (req, res) => {
    res.send(`
    <h1>🚀 w8less Engine</h1>
    <p>O Motor está rodando!</p>
    <p>Status: <strong>Online</strong></p>
  `);
});
app.listen(3001, () => {
    console.log('🔥 Engine rodando na porta 3001');
});
