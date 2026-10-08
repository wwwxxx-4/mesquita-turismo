/* MODO LIVE das páginas (08/10/2026): para mostrar a página numa live
   (TikTok LIVE Studio, OBS) sem o cabeçalho do site.

     ?live=1          esconde o cabeçalho (logo + WhatsApp)
     ?live=2          versão enxuta: esconde cabeçalho, título, filtros e rodapé (só os cartões)
     &rolar=8         rola sozinha de cartão em cartão a cada 8 s e volta ao início no fim
     &de=SAO          (passagens, a página já entende) abre filtrada por essa origem

   Os painéis /live/youtube/ e /live/tiktok/ abrem a página assim, dentro deles.
   Sem ?live a página é a normal: este arquivo não faz nada. */
(function () {
  var q = new URLSearchParams(location.search);
  var nivel = q.get('live');
  if (!nivel) return;
  var css = 'header.topo, .topo { display: none !important; }'
    // enxuto: foto mais baixa e sem os botões de cada cartão (o painel da live
    // já mostra o WhatsApp), para o cartão inteiro, com o preço, caber na tela
    + (nivel === '2' ? '.hero, .filtros, .rodape, footer, .live-yt, .metodo, .quero-rot, .quero, .fontes { display: none !important; }'
      + ' .pagina { padding-top: 12px !important; } .foto { aspect-ratio: 3 / 1 !important; } .galeria .capa { aspect-ratio: 16 / 9 !important; }' : '')
    + 'html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  addEventListener('load', function () {
    var seg = Number(q.get('rolar'));
    if (!seg) return;
    var i = 0;
    // fala-se sobre um cartão por vez: o cartão para no topo da área visível
    setInterval(function () {
      var cards = document.querySelectorAll('.card');
      if (!cards.length) return;
      i = (i + 1) % cards.length;
      if (i === 0) scrollTo({ top: 0, behavior: 'smooth' });
      else cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, seg * 1000);
  });
})();
