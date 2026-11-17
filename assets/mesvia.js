// PONTE COM A MESVIA (16/11/2026, decisão do Wester: "Só no site"). Entra em todas as páginas pelo
// build (scripts/canal.mjs), como a faixa do canal:
//   1) link "Achados de viagem" no rodapé de todas as páginas, para mesvia.com.br;
//   2) nas páginas de destino e de série de hotel, uma linha discreta "O que levar: guia da Mesvia"
//      com o guia do tipo de viagem (internacional ou nacional).
// Não vai para cotação, proposta, pós-venda, mensagem a cliente nem e-mail (só o site principal).
(function () {
  var MESVIA = 'https://mesvia.com.br/';
  var UTM = '?utm_source=mesquitaturismo&utm_medium=site';
  try { if (/[?&]live=/.test(location.search)) return; } catch (e) { return; }

  // 1) rodapé: um link pequeno junto dos outros links do rodapé
  var rodape = document.querySelector('footer, .rodape, #rodape');
  if (rodape && !rodape.querySelector('[data-mesvia]')) {
    var p = document.createElement('div');
    p.setAttribute('data-mesvia', '');
    p.style.cssText = 'margin-top:10px;font-size:14px;opacity:.85';
    p.innerHTML = '<a href="' + MESVIA + UTM + '" target="_blank" rel="noopener" style="color:inherit">Achados de viagem: o que levar e o que comprar, na Mesvia</a>';
    rodape.appendChild(p);
  }

  // 2) "O que levar": só nas páginas de destino e de série de hotel
  var pasta = location.pathname.split('/').filter(Boolean)[0] || '';
  var INTERNACIONAL = ['paris-glamour', 'caribe-saindo-do-brasil'];
  var NACIONAL = ['resorts-brasil', 'praias-brasil', 'resorts-perto-de-sp', 'hoteis-romanticos-perto-de-sp', 'resorts-novos',
    'hoteis-voce-sabia', 'litoral-norte-bahia', 'resorts-pouco-conhecidos', 'resorts-porto-de-galinhas', 'resorts-com-parque-aquatico',
    'transamerica-comandatuba', 'costao-do-santinho', 'rio-quente-hotel-pousada', 'salinas-maceio', 'clara-arte-inhotim',
    'hotel-unique-sao-paulo', 'montissi-resort', 'pacotes-porto-seguro', 'pacotes-fortaleza', 'pacotes-recife'];
  var guia = INTERNACIONAL.indexOf(pasta) >= 0 ? ['checklist-viagem-internacional.html', 'checklist para viagem internacional']
    : NACIONAL.indexOf(pasta) >= 0 ? ['como-arrumar-a-mala.html', 'como arrumar a mala'] : null;
  if (!guia || document.querySelector('[data-mesvia-guia]')) return;
  var linha = document.createElement('div');
  linha.setAttribute('data-mesvia-guia', '');
  linha.style.cssText = 'max-width:980px;margin:22px auto 0;padding:0 16px;text-align:center;font:500 15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:inherit;opacity:.9';
  linha.innerHTML = '🧳 O que levar: <a href="' + MESVIA + 'guias/' + guia[0] + UTM + '" target="_blank" rel="noopener" style="color:#1072B9;font-weight:600">' + guia[1] + ', no guia da Mesvia</a>';
  // logo antes da faixa do canal, se ela já estiver na página; senão antes do rodapé
  var antes = document.querySelector('.mt-canal') || rodape;
  if (antes && antes.parentNode) antes.parentNode.insertBefore(linha, antes); else document.body.appendChild(linha);
})();
