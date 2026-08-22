/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/auto-commit-gemini.js
// Faz commit automático usando mensagem gerada pela Gemini API

const { execSync } = require('child_process');
const https = require('https');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY não encontrado no .env');
  process.exit(1);
}

function getGitDiff() {
  try {
    return execSync('git diff --cached', { encoding: 'utf8' });
  } catch (error) {
    console.error('Erro ao obter diff do git:', error.message);
    process.exit(1);
  }
}

async function getCommitMessage(diff) {
  const prompt = `You are Lilith's intelligence core. Generate a professional and precise git commit message based on the following diff.
Use the Conventional Commits specification (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert).
The message must have a concise subject line (max 60 characters) in imperative mood.
If the changes are significant, add a brief body explaining 'what' and 'why' (not the 'how').

Format:
<type>(<scope>): <subject>

[optional body]

English only. Respond ONLY with the commit message, no quotes, no conversational filler.

Diff:
${diff}`;

  if (GEMINI_API_KEY) {
    try {
      return await fetchGemini(prompt);
    } catch (e) {
      console.error('❌ Erro ao invocar o poder da Gemini:', e.message);
      throw e;
    }
  }

  throw new Error('Nenhuma API key válida para manifestar a vontade do sistema.');
}

function fetchGemini(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: "You are a master of git architecture. You follow Conventional Commits strictly. Your messages are cold, precise, and professional." }]
      },
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.1
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            console.error('Erro da Gemini API:', json.error.message);
            return reject(new Error(json.error.message));
          }
          if (!json.candidates || !json.candidates[0] || !json.candidates[0].content || !json.candidates[0].content.parts[0]) {
            console.error('Resposta bruta da Gemini:', body);
            return reject(new Error('Resposta inválida da Gemini'));
          }
          const msg = json.candidates[0].content.parts[0].text.trim();
          resolve(msg.replace(/^"|"$/g, ''));
        } catch (e) {
          console.error('Resposta bruta da Gemini:', body);
          reject(new Error('Erro ao processar resposta da Gemini: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔮 Lilith está expandindo o domínio... Sincronizando mudanças.');
  execSync('git add .');

  // Verificar se há mudanças staged
  try {
    const stagedChanges = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    if (!stagedChanges) {
      console.log('🌑 Nada novo para dominar. Staging vazio.');
      return;
    }
    console.log('✨ Alvos detectados:', stagedChanges.split('\n').length, 'arquivo(s) modificado(s)');
  } catch (error) {
    console.log('⚠️ Falha na varredura:', error.message);
    return;
  }

  const diff = getGitDiff();
  if (!diff.trim()) {
    console.log('🌑 Sem essência para extrair. Diff vazio.');
    return;
  }
  console.log('🧠 Extraindo inteligência do código via Gemini...');
  const commitMsg = await getCommitMessage(diff);
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  console.log('🔥 Vontade manifestada:', commitMsg);

  // Fazer push automático
  try {
    console.log('🚀 Lançando para o núcleo remoto...');

    // Verificar se há um branch remoto configurado
    let pushCommand = 'git push';
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      pushCommand = `git push origin ${currentBranch}`;
      console.log(`📡 Rota: origin/${currentBranch}`);
    } catch {
      console.log('⚠️ Rota remota não mapeada, usando comando padrão...');
    }

    execSync(pushCommand);
    console.log('✅ Dominação completa. Realidade atualizada.');
  } catch (pushError) {
    console.log('⚠️ Aviso: O núcleo remoto resistiu ao push automático.');
    console.log('💡 Execute manualmente: git push');
    if (pushError.message) {
      console.log('📝 Relatório de erro:', pushError.message.split('\n')[0]);
    }
  }
}

main().catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});
