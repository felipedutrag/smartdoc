const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Pega um numero publico qualquer do tjsp (exemplo de ação civil publica ou algo comum)
  // 1000001-50.2020.8.26.0000 (just a guess, or we can use a typical structure)
  // Let's use 1001001-11.2023.8.26.0100 (Foro Central SP)
  const numero_processo = "1001001-11.2023.8.26.0100";
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const url = `https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsulta=${numero_processo}&dadosConsulta.tipoNuProcesso=UNIFICADO`;
  
  console.log("Navigating to", url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Save HTML
  const html = await page.content();
  fs.writeFileSync('C:\\Users\\felip\\.gemini\\antigravity\\brain\\c7bbc418-7e43-4bdd-b6dd-f84942647ca7\\scratch\\esaj.html', html);
  
  await page.screenshot({ path: 'C:\\Users\\felip\\.gemini\\antigravity\\brain\\c7bbc418-7e43-4bdd-b6dd-f84942647ca7\\scratch\\esaj.png' });
  
  console.log("Saved screenshot and HTML");
  await browser.close();
})();
