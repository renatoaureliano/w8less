import { WorkflowDefinition } from '@w8less/shared';
import { executeGraph } from './queue';

/**
 * 🏁 GRAND FINALE: "Analista de Sentimento Automático" 🤖💔
 * 
 * Cenário: Um cliente furioso deixa uma reclamação.
 * O sistema de IA analisa e redireciona para o caminho correto.
 * 
 * Resultado esperado: ALERTA DE CRISE (porque a reclamação é negativa)
 */

async function runGrandFinaleTest() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  🏁 GRAND FINALE TEST START 🏁                ║
║         "Analista de Sentimento Automático" 🤖💔              ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Workflow que usa TUDO junto: Input -> LLM -> IF -> Code
  const workflow: WorkflowDefinition = {
    nodes: [
      // 1. O Gatilho: Uma reclamação de cliente
      { 
        id: '1', 
        type: 'numberInput',
        position: { x: 400, y: 0 }, 
        data: { 
          payload: { review: "O produto chegou quebrado e o suporte não me atende! Odiei." } 
        }
      },
      
      // 2. O Cérebro: Analisa sentimento com LLM
      { 
        id: 'ai-1', 
        type: 'llmNode',
        position: { x: 400, y: 150 },
        data: {
          model: 'gpt-3.5-turbo',
          apiKey: process.env.OPENAI_API_KEY || '',  // Usa env var se disponível
          prompt: 'Você é um classificador de sentimento. Responda APENAS com uma palavra: "POSITIVO" ou "NEGATIVO". Sem pontuação. Analise isto: "{{ $input.review }}"'
        }
      },

      // 3. O Juiz: Avalia o resultado
      { 
        id: 'decision-1', 
        type: 'ifNode',
        position: { x: 400, y: 350 },
        data: {
          value1: '{{ $input }}',     // Input é a resposta da IA
          operator: 'contains',
          value2: 'NEGATIVO'
        }
      },

      // 4. Caminho TRUE: Crise detectada
      { 
        id: 'alert-node', 
        type: 'default',
        position: { x: 100, y: 550 },
        data: {
          label: '🚨 ALERTA DE CRISE',
          code: `return "Abrir Ticket Urgente: Cliente furioso.";`
        }
      },

      // 5. Caminho FALSE: Cliente feliz
      { 
        id: 'success-node', 
        type: 'default',
        position: { x: 700, y: 550 },
        data: {
          label: '✅ Cliente Feliz',
          code: `return "Mandar cupom de desconto de agradecimento.";`
        }
      }
    ],
    edges: [
      { id: 'e1-ai', source: '1', target: 'ai-1', animated: true },
      { id: 'eai-decision', source: 'ai-1', target: 'decision-1', animated: true },
      
      // Ramificação TRUE (NEGATIVO) -> Alerta de Crise
      { 
        id: 'e-true', 
        source: 'decision-1', 
        target: 'alert-node',
        sourceHandle: 'true',
        animated: true
      },
      
      // Ramificação FALSE (POSITIVO) -> Cliente Feliz
      { 
        id: 'e-false', 
        source: 'decision-1', 
        target: 'success-node',
        sourceHandle: 'false',
        animated: true
      }
    ]
  };

  try {
    console.log('\n[1] Enviando workflow para execução...\n');
    
    const result = await executeGraph(workflow);

    console.log('\n[2] Validando estrutura de retorno... ✅');
    if (!result.history) throw new Error('Sem history no resultado');

    console.log('\n[3] Analisando execução:\n');
    
    // Validação do Input Node
    const inputHistory = result.history['1'];
    console.log('   📥 Input Node:');
    console.log(`      - Status: ${inputHistory.status === 'success' ? '✅' : '❌'} ${inputHistory.status}`);
    console.log(`      - Output: ${JSON.stringify(inputHistory.output)}\n`);

    // Validação do LLM Node
    const llmHistory = result.history['ai-1'];
    console.log('   🤖 LLM Node:');
    console.log(`      - Status: ${llmHistory.status === 'success' ? '✅' : '❌'} ${llmHistory.status}`);
    
    // Trata output como string ou objeto de erro
    const llmOutput = typeof llmHistory.output === 'string' ? llmHistory.output : '[Erro na API]';
    console.log(`      - Output: "${llmOutput}"`);
    console.log(`      - Detectado como: ${llmOutput.includes('NEGATIVO') ? '😠 NEGATIVO' : '😊 POSITIVO'}\n`);

    // Validação do IF Node
    const ifHistory = result.history['decision-1'];
    console.log('   ⚖️  IF Node:');
    console.log(`      - Status: ${ifHistory.status === 'success' ? '✅' : '❌'} ${ifHistory.status}`);
    console.log(`      - Condição: "{{ $input }} contains 'NEGATIVO'"`);
    console.log(`      - Resultado: ${ifHistory.output ? '✅ TRUE' : '❌ FALSE'}\n`);

    // Validação da Ramificação
    const wasAlertNodeExecuted = result.history['alert-node']?.status === 'success';
    const wasSuccessNodeExecuted = result.history['success-node']?.status === 'success';

    console.log('   🔀 Ramificação:');
    console.log(`      - Nó de CRISE (alert-node): ${wasAlertNodeExecuted ? '✅ EXECUTADO' : '❌ IGNORADO'}`);
    console.log(`      - Nó de SUCESSO (success-node): ${wasSuccessNodeExecuted ? '✅ EXECUTADO' : '❌ IGNORADO'}\n`);

    // Resultado final
    if (wasAlertNodeExecuted) {
      const alertResult = result.history['alert-node'];
      console.log(`   🎯 Resultado do Nó de CRISE:\n      "${alertResult.output}"\n`);
    }

    // Validações finais
    console.log('\n[4] Validações Finais:\n');

    let allTestsPassed = true;

    // Teste 1: IA detectou NEGATIVO
    if (typeof llmHistory.output === 'string' && llmHistory.output.includes('NEGATIVO')) {
      console.log('   ✅ IA corretamente detectou sentimento NEGATIVO');
    } else {
      console.log('   ⚠️  IA não detectou claramente NEGATIVO (mock sem API Key)');
    }

    // Teste 2: IF detectou NEGATIVO
    if (ifHistory.output === true) {
      console.log('   ✅ IF corretamente avaliou condição como TRUE (NEGATIVO detectado)');
    } else {
      console.log('   ❌ IF deveria ter avaliado como TRUE');
      allTestsPassed = false;
    }

    // Teste 3: Ramificação correta
    if (wasAlertNodeExecuted && !wasSuccessNodeExecuted) {
      console.log('   ✅ Fluxo levou para ALERTA DE CRISE (caminho correto!)');
    } else {
      console.log('   ❌ Fluxo deveria ir para ALERTA DE CRISE apenas');
      allTestsPassed = false;
    }

    // Teste 4: Resultado esperado
    if (wasAlertNodeExecuted && result.history['alert-node'].output === 'Abrir Ticket Urgente: Cliente furioso.') {
      console.log('   ✅ Resultado final correto!');
    } else {
      console.log('   ❌ Resultado final incorreto');
      allTestsPassed = false;
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    if (allTestsPassed) {
      console.log('║           ✅ GRAND FINALE TEST PASSED! 🎉🎉🎉               ║');
      console.log('║                                                                ║');
      console.log('║  Você construiu um Agente Autônomo completo! 🚀               ║');
      console.log('║  Input -> LLM -> IF -> Múltiplos Caminhos -> Executado ✨     ║');
    } else {
      console.log('║                ❌ SOME TESTS FAILED 😞                        ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (error: any) {
    console.error('\n❌ ERRO NA EXECUÇÃO:', error.message);
    console.error(error.stack);
  }
}

// Executa o teste
runGrandFinaleTest().catch(console.error);
