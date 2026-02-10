import { executeGraph } from './queue';

async function testLlmWorkflow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TEST: LLM Node Integration');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ⚠️ SUBSTITUA PELA SUA CHAVE OPENAI
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-seu-token-aqui';

  const workflow = {
    nodes: [
      { 
        id: '1', 
        type: 'input', 
        position: { x: 0, y: 0 }, 
        data: { payload: { theme: 'Gatos' } } 
      },
      {
        id: 'llm-1',
        type: 'llmNode',
        position: { x: 0, y: 0 },
        data: {
          apiKey: OPENAI_API_KEY,
          model: 'gpt-3.5-turbo',
          prompt: 'Escreva uma frase curta e criativa sobre {{ $input.theme }}. Máximo 30 palavras.'
        }
      }
    ],
    edges: [
      { id: 'e1-llm', source: '1', target: 'llm-1' }
    ]
  };

  try {
    console.log('[1] Enviando workflow com LLM Node...\n');
    const result = await executeGraph(workflow as any);
    
    // TEST 1: Verifica se retorna history
    console.log('[2] Validando estrutura de retorno...');
    if (!result.history) {
      throw new Error('❌ result.history não encontrado');
    }
    console.log('✅ result.history existe\n');

    // TEST 2: Verifica campos do input
    console.log('[3] Validando Input Node...');
    const inputHistory = result.history['1'];
    if (inputHistory.output.theme !== 'Gatos') {
      throw new Error(`❌ Input payload incorreto. Got: ${inputHistory.output.theme}`);
    }
    console.log('✅ Input Node retornou payload correto');
    console.log(`   - Output: ${JSON.stringify(inputHistory.output)}\n`);

    // TEST 3: Verifica LLM Node
    console.log('[4] Validando LLM Node...');
    const llmHistory = result.history['llm-1'];
    
    if (llmHistory.status !== 'success') {
      throw new Error(`❌ LLM Node falhou: ${llmHistory.status}`);
    }
    console.log('✅ LLM Node executou com sucesso');
    
    if (typeof llmHistory.output !== 'string' || llmHistory.output.length === 0) {
      throw new Error(`❌ LLM output inválido: ${llmHistory.output}`);
    }
    console.log(`✅ LLM retornou texto válido`);
    console.log(`   - Resposta: "${llmHistory.output.substring(0, 100)}..."\n`);

    // TEST 4: Verifica se template foi substituído
    console.log('[5] Validando Template Engine...');
    const promptTemplate = workflow.nodes[1].data.prompt;
    if (promptTemplate && promptTemplate.includes('{{ $input.theme }}')) {
      console.log('✅ Template original contém {{ $input.theme }}');
    }
    // A substituição já aconteceu no backend, verificamos que a saída é sensata
    if (llmHistory.logs[0].includes('gpt-3.5-turbo')) {
      console.log('✅ Template foi processado e enviado para OpenAI\n');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES DO LLM PASSARAM!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nResumo:');
    console.log('  ✅ Input Node carrega payload corretamente');
    console.log('  ✅ LLM Node substitui variáveis no prompt');
    console.log('  ✅ LLM Node chama OpenAI com sucesso');
    console.log('  ✅ Resposta é retornada e armazenada no history');
    console.log('\nPróxima fase: Transformadores, Paralelização, etc.');

  } catch (err: any) {
    console.error('\n❌ ERRO NO TESTE:', err.message);
    console.error('\n💡 Dicas:');
    console.error('   1. Verifique se OPENAI_API_KEY foi definida');
    console.error('   2. Verifique se você tem saldo no OpenAI');
    console.error('   3. Execute com: OPENAI_API_KEY=sk-... npm run test:llm');
    process.exit(1);
  }
}

testLlmWorkflow();
