// FAIXA "SIGA O CANAL" (16/11/2026, pedido do Wester): uma linha discreta no fim de todas as
// páginas do site com o link do canal da Mesquita no WhatsApp. Entra em todas as páginas pelo
// build (scripts/canal.mjs). Não aparece:
//   - nos painéis de live (?live=...), que vão para a tela da transmissão;
//   - em página que já tem o bloco do canal (qualquer elemento com data-canal);
//   - em página marcada com <body data-sem-canal>.
(function () {
  var LINK = 'https://www.mesquitaturismo.com.br/v/qmfge8';
  try {
    if (/[?&]live=/.test(location.search)) return;
    if (document.body.hasAttribute('data-sem-canal') || document.querySelector('[data-canal]')) return;
  } catch (e) { return; }
  var css = '.mt-canal{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;'
    + 'margin:28px auto 0;padding:14px 16px;max-width:980px;border-top:1px solid rgba(0,0,0,.08);'
    + 'font:500 15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2d3d;text-align:center}'
    + '.mt-canal svg{width:20px;height:20px;fill:#25D366;flex:none}'
    + '.mt-canal a{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;'
    + 'background:#25D366;color:#fff;text-decoration:none;font-weight:700;white-space:nowrap}'
    + '.mt-canal a:hover{filter:brightness(.95)}'
    + '@media (prefers-color-scheme:dark){.mt-canal{color:#e8eef5;border-top-color:rgba(255,255,255,.12)}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var zap = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.3.4c.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2z"/></svg>';
  var div = document.createElement('div');
  div.className = 'mt-canal';
  div.setAttribute('data-canal', '');
  div.innerHTML = zap + '<span>Promoções de viagem todo dia no canal da Mesquita no WhatsApp.</span>'
    + '<a href="' + LINK + '" target="_blank" rel="noopener">Seguir o canal</a>';
  // antes do rodapé da página, se tiver; senão no fim do conteúdo
  var rodape = document.querySelector('footer, .rodape, #rodape');
  if (rodape && rodape.parentNode) rodape.parentNode.insertBefore(div, rodape);
  else document.body.appendChild(div);
})();
