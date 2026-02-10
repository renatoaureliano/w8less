import { executeGraph } from './queue';

async function runTest() {
  const workflow = {
    nodes: [
      { id: '1', type: 'input', position: { x: 0, y: 0 }, data: { payload: {} } },
      { id: 'http-1', type: 'httpNode', position: { x: 0, y: 0 }, data: { url: 'https://jsonplaceholder.typicode.com/todos/1', method: 'GET' } },
      { id: '2', type: 'default', position: { x: 0, y: 0 }, data: { code: `return "O título da tarefa é: " + $input.title;` } }
    ],
    edges: [
      { id: 'e1-http', source: '1', target: 'http-1' },
      { id: 'ehttp-2', source: 'http-1', target: '2' }
    ]
  };

  try {
    console.log('[Test] Iniciando execução do workflow de teste...');
    const result = await executeGraph(workflow as any);
    console.log('[Test] Execution history:', JSON.stringify(result.history, null, 2));

    // Checks
    const httpOut = result.history['http-1']?.output;
    const codeInput = result.history['2']?.input;

    console.log('[Test] http-1.output.title =', httpOut?.title);
    console.log('[Test] code node input equals http output:', JSON.stringify(codeInput) === JSON.stringify(httpOut));

    if (httpOut?.title === 'delectus aut autem' && JSON.stringify(codeInput) === JSON.stringify(httpOut)) {
      console.log('[Test] ✅ Critério de sucesso atendido.');
    } else {
      console.error('[Test] ❌ Critério de sucesso falhou.');
    }
  } catch (err: any) {
    console.error('[Test] Erro durante o teste:', err.message || err);
  }
}

runTest();
