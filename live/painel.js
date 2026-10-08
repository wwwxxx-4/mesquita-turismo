/* PAINEL DE APRESENTAÇÃO AO VIVO (08/10/2026): ele na câmera + a página do site,
   no YouTube (1920x1080) e no TikTok (1080x1920) ao mesmo tempo.

   /live/youtube/  e  /live/tiktok/  (sem "?" - o TikTok LIVE Studio recusa)
   Opções na URL (no OBS pode usar): ?pagina=/resorts-brasil/  ?rolar=0 (não rola)
   ?rolar=12 (segundos por cartão)  ?nome=Wester  ?titulo=...

   A câmera NÃO está aqui: o quadro "câmera" é um lugar marcado. No OBS ou no
   LIVE Studio, ponha a fonte da câmera POR CIMA desse quadro, do mesmo tamanho.
   A página aparece sem o cabeçalho (/assets/modo-live.js, ?live=2). */
(function () {
  var F = document.body.dataset.formato === 'v' ? 'v' : 'h';
  var q = new URLSearchParams(location.search);
  var pagina = q.get('pagina') || '/passagens-em-oferta/';
  var TITULOS = { '/passagens-em-oferta/': 'Passagens mais baratas que no Google', '/resorts-brasil/': 'Os 30 melhores resorts do Brasil', '/promocoes-passagens/': 'Promoções de passagens' };
  var titulo = q.get('titulo') || TITULOS[pagina] || 'Mesquita Turismo ao vivo';
  var rolar = q.has('rolar') ? Number(q.get('rolar')) : 12;
  var nome = q.get('nome') || 'Wester';
  var zap = { exibicao: '(11) 95396-7095' };
  var url = 'https://www.mesquitaturismo.com.br' + pagina;
  var src = pagina + '?live=2' + (rolar ? '&rolar=' + rolar : '');
  var W = F === 'h' ? 1920 : 1080, H = F === 'h' ? 1080 : 1920;
  // a página é desenhada mais estreita e ampliada: letra grande na live
  var CAIXA = F === 'h' ? { x: 40, y: 100, w: 1200, h: 940, escala: 1.2 } : { x: 30, y: 672, w: 900, h: 724, escala: 1.5 };
  var CAM = F === 'h' ? { x: 1270, y: 100, w: 610, h: 343 } : { x: 30, y: 212, w: 900, h: 400 };

  var css = '*{box-sizing:border-box;margin:0}html,body{width:100%;height:100%;overflow:hidden;background:#050b16}'
    + '#p{position:absolute;left:50%;top:50%;width:' + W + 'px;height:' + H + 'px;transform-origin:center;overflow:hidden;background:linear-gradient(135deg,#0B2440,#071628 60%,#0b2f57);color:#fff;font-family:Barlow,system-ui,sans-serif}'
    + '.ao{background:#E11D48;color:#fff;font:800 24px "Barlow Condensed";letter-spacing:.08em;padding:4px 14px;border-radius:7px;display:inline-flex;gap:9px;align-items:center}'
    + '.ao:before{content:"";width:11px;height:11px;border-radius:50%;background:#fff;animation:pi 1s infinite}@keyframes pi{50%{opacity:.3}}'
    + '.tit{font:800 38px "Barlow Condensed"}'
    + '.caixa{position:absolute;background:#F5F8FB;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}'
    + '.caixa iframe{border:0;transform-origin:0 0;background:#F5F8FB}'
    + '.cam{position:absolute;border-radius:20px;border:3px dashed rgba(85,181,229,.55);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font:700 24px Barlow;background:rgba(255,255,255,.04)}'
    + '.etq{position:absolute;background:#fff;color:#0B2440;border-radius:12px;padding:6px 14px;font:800 26px "Barlow Condensed";box-shadow:0 6px 20px rgba(0,0,0,.35)}'
    + '.etq small{display:block;font:600 15px Barlow;color:#55657C;margin-top:-2px}'
    + '.zap{background:#1FAF38;color:#fff;border-radius:999px;font:800 28px "Barlow Condensed";padding:9px 20px;display:inline-flex;gap:10px;align-items:center;white-space:nowrap}'
    + '.box{background:rgba(11,36,64,.9);border:1px solid rgba(85,181,229,.35);border-radius:20px;padding:18px 20px}'
    + '.logo{background:#fff;border-radius:12px;padding:7px 12px}.logo img{height:42px;display:block}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var fonte = document.createElement('link'); fonte.rel = 'stylesheet';
  fonte.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@600;700&display=swap';
  document.head.appendChild(fonte);

  var px = function (o) { return 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px'; };
  var iframe = '<div class="caixa" style="' + px(CAIXA) + '"><iframe src="' + src + '" style="width:' + Math.round(CAIXA.w / CAIXA.escala) + 'px;height:' + Math.round(CAIXA.h / CAIXA.escala) + 'px;transform:scale(' + CAIXA.escala + ')"></iframe></div>';
  var cam = '<div class="cam" style="' + px(CAM) + '">câmera aqui</div>';
  var qr = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&color=0B2440&data=' + encodeURIComponent(url);
  var html;
  if (F === 'h') {
    html = '<div style="position:absolute;left:40px;top:26px;display:flex;gap:16px;align-items:center"><span class="ao">AO VIVO</span><span class="tit">' + titulo + '</span></div>'
      + '<div class="logo" style="position:absolute;right:40px;top:20px"><img src="/assets/logo-mesquita.png" alt="Mesquita Turismo"></div>'
      + iframe + cam
      + '<div class="etq" style="left:' + (CAM.x + 16) + 'px;top:' + (CAM.y + CAM.h - 58) + 'px">' + nome + '<small>Mesquita Turismo</small></div>'
      + '<div class="box" style="position:absolute;left:1270px;top:470px;width:610px;display:grid;gap:16px">'
      + '<div style="font:800 34px \'Barlow Condensed\'">💬 Pergunte no chat!</div>'
      + '<div style="font:600 22px Barlow;color:#cfe0f5;line-height:1.35">Eu respondo ao vivo. Para reservar ou cotar a sua data, chame no WhatsApp:</div>'
      + '<div class="zap">WhatsApp ' + zap.exibicao + '</div>'
      + '<div style="display:flex;gap:18px;align-items:center;margin-top:4px"><img src="' + qr + '" style="width:150px;height:150px;border-radius:10px;background:#fff;padding:8px">'
      + '<div style="font:600 21px Barlow;color:#cfe0f5;line-height:1.35">Aponte a câmera do celular e abra a página com todas as ofertas<br><b style="color:#fff">mesquitaturismo.com.br</b></div></div></div>';
  } else {
    // TikTok: o topo (~200 px), a coluna da direita (~140 px) e a metade de baixo
    // (comentários) ficam cobertos pela interface do app - nada importante ali
    html = cam
      + '<div class="etq" style="left:' + (CAM.x + 16) + 'px;top:' + (CAM.y + CAM.h - 58) + 'px">' + nome + '<small>Mesquita Turismo</small></div>'
      + '<div style="position:absolute;left:30px;top:622px;width:900px;display:flex;gap:12px;align-items:center"><span class="ao">AO VIVO</span><span class="tit" style="font-size:34px">' + titulo + '</span></div>'
      + iframe
      // WhatsApp no canto de baixo da câmera: a faixa de baixo da tela é dos comentários
      + '<div style="position:absolute;right:' + (W - CAM.x - CAM.w + 16) + 'px;top:' + (CAM.y + CAM.h - 56) + 'px"><span class="zap" style="font-size:24px;padding:7px 16px">Link na bio · WhatsApp ' + zap.exibicao + '</span></div>';
  }
  var p = document.createElement('div'); p.id = 'p'; p.innerHTML = html; document.body.appendChild(p);
  function ajustar() { p.style.transform = 'translate(-50%,-50%) scale(' + Math.min(innerWidth / W, innerHeight / H) + ')'; }
  addEventListener('resize', ajustar); ajustar();
})();
