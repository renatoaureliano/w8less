import { Router } from 'express';
// Importamos a instância já inicializada como singleton
import { prisma } from './prisma';

const router = Router();

console.log('[ROUTES] Rota de Workflows carregada.');

// POST /workflows - cria novo workflow
router.post('/', async (req, res) => {
  try {
    const { name, nodes, edges } = req.body;
    if (!name || !nodes || !edges) {
      return res.status(400).json({ error: 'Dados incompletos: name, nodes e edges são obrigatórios' });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        nodes: nodes as any,
        edges: edges as any,
      },
    });
    
    console.log('[WORKFLOWS] ✓ Workflow criado:', workflow.id);
    res.json({ id: workflow.id });
  } catch (error: any) {
    console.error('[WORKFLOWS] ❌ Erro ao criar:', error.message);
    res.status(500).json({ error: 'Erro ao salvar workflow' });
  }
});

// PUT /workflows/:id - atualiza workflow
router.put('/:id', async (req, res) => {
  try {
    const { name, nodes, edges } = req.body;
    const { id } = req.params;
    
    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        name,
        nodes: nodes as any,
        edges: edges as any,
      },
    });
    
    console.log('[WORKFLOWS] ✓ Workflow atualizado:', id);
    res.json({ id: workflow.id });
  } catch (error: any) {
    console.error('[WORKFLOWS] ❌ Erro ao atualizar:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar workflow' });
  }
});

// GET /workflows - lista todos (id e nome)
router.get('/', async (_req, res) => {
  try {
    const list = await prisma.workflow.findMany({
      select: { id: true, name: true },
    });
    
    console.log('[WORKFLOWS] ✓ Listados', list.length, 'workflows');
    res.json(list);
  } catch (error: any) {
    console.error('[WORKFLOWS] ❌ Erro ao listar:', error.message);
    res.status(500).json({ error: 'Erro ao listar workflows' });
  }
});

// GET /workflows/:id - retorna workflow completo
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }
    
    console.log('[WORKFLOWS] ✓ Carregado:', id);
    res.json(workflow);
  } catch (error: any) {
    console.error('[WORKFLOWS] ❌ Erro ao buscar:', error.message);
    res.status(500).json({ error: 'Erro ao buscar workflow' });
  }
});

export default router;