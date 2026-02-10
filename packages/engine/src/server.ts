import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { workflowQueue } from './queue';
import { WorkflowDefinition } from '@w8less/shared';
import workflowController from './workflow-controller';
import { prisma } from './prisma';

const app = express();

// 1. Configuração de Segurança e Leitura (Middlewares)
app.use(cors()); // Libera o acesso do Frontend
app.use(express.json()); // Permite ler JSON no body

// 2. ROTA DE DISPARO (POST) - A que estava faltando!
app.post('/workflows/execute', async (req, res) => {
  try {
    const workflow = req.body as WorkflowDefinition;
    console.log(`[API] 📥 Recebido workflow com ${workflow.nodes.length} nós.`);

    // Adiciona o workflow na fila do Redis
    const job = await workflowQueue.add('execute-workflow', workflow);

    console.log(`[API] 📤 Enviado para a fila (Job ID: ${job.id})`);
    
    // Retorna o ID para o frontend poder acompanhar depois
    res.json({ 
      message: 'Workflow enfileirado com sucesso!', 
      jobId: job.id 
    });

  } catch (error: any) {
    console.error('[API] ❌ Erro ao enfileirar:', error);
    res.status(500).json({ error: 'Erro interno ao processar workflow' });
  }
});

// Rota para hooks externos: POST /hooks/:workflowId
app.post('/hooks/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const body = req.body || {};

    // Enfileira um job que vai executar o workflow pelo ID, com payload inicial
    const job = await workflowQueue.add('execute-workflow', { workflowId, initialPayload: body });

    console.log(`[API] 🔔 Hook recebido para workflow ${workflowId} (Job ${job.id})`);
    return res.status(200).json({ message: 'Workflow disparado', jobId: job.id });
  } catch (err: any) {
    console.error('Erro ao processar hook', err);
    return res.status(500).json({ message: 'Erro ao disparar workflow' });
  }
});

// 3. ROTA DE ACOMPANHAMENTO (GET) - Para o Polling
app.get('/workflows/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await workflowQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job não encontrado' });
    }

    const state = await job.getState();
    const result = job.returnvalue;

    res.json({ 
      id: jobId, 
      state: state, 
      result: result 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar job' });
  }
});

// 4. ROTA DE WORKFLOW (GET) - Para o Polling
app.use('/workflows', workflowController);

app.get('/', (req, res) => {
  res.send('🚀 W8LESS Engine está rodando! Acesse /workflows para ver os dados.');
});

// 5. Iniciar o Servidor
app.listen(3001, () => {
  console.log('🔥 Engine rodando na porta 3001');
});