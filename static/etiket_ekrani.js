/* Urun Etiket Ekrani - istemci tarafi */

var urunler = [];
var seciliIdler = new Set();
var fiyatlar = {};
var ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
var olcek = 3;
var bildirimZamanlayici = null;

/* ── Yardimcilar ── */

function kacir(metin) {
  if (!metin) return '';
  var div = document.createElement('div');
  div.textContent = String(metin);
  return div.innerHTML;
}

function bugunTarih() {
  var d = new Date();
  var gun = ('0' + d.getDate()).slice(-2);
  var ay = ('0' + (d.getMonth() + 1)).slice(-2);
  return gun + '.' + ay + '.' + d.getFullYear();
}

/* ── Bildirim ── */

function bildirimGoster(tip, baslik, metin) {
  var el = document.getElementById('bildirim');
  var icerik = document.getElementById('bildirimIcerik');
  var ikon = document.getElementById('bildirimIkon');
  document.getElementById('bildirimBaslik').textContent = baslik;
  document.getElementById('bildirimMetin').textContent = metin;

  icerik.className = 'rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 ';
  if (tip === 'hata') {
    icerik.className += 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    ikon.className = 'ph ph-warning-circle text-xl flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400';
  } else {
    icerik.className += 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    ikon.className = 'ph ph-check-circle text-xl flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400';
  }

  el.classList.remove('hidden');
  if (bildirimZamanlayici) clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(bildirimKapat, 5000);
}

function bildirimKapat() {
  document.getElementById('bildirim').classList.add('hidden');
  if (bildirimZamanlayici) { clearTimeout(bildirimZamanlayici); bildirimZamanlayici = null; }
}

/* ── Adim Yonetimi ── */

function adimGit(no) {
  if (no === 2 && seciliIdler.size === 0) {
    bildirimGoster('hata', 'Uyarı', 'Önce en az bir ürün seçin');
    return;
  }
  if (no === 3) {
    if (seciliIdler.size === 0) {
      bildirimGoster('hata', 'Uyarı', 'Önce ürün seçin');
      return;
    }
    var eksikFiyat = false;
    seciliIdler.forEach(function(id) {
      if (!fiyatlar[id] || fiyatlar[id] === '' || fiyatlar[id] === '0') eksikFiyat = true;
    });
    if (eksikFiyat) {
      bildirimGoster('hata', 'Uyarı', 'Tüm seçili ürünlere fiyat girin');
      return;
    }
  }

  document.getElementById('adim1').classList.add('hidden');
  document.getElementById('adim2').classList.add('hidden');
  document.getElementById('adim3').classList.add('hidden');
  document.getElementById('adim' + no).classList.remove('hidden');

  var aktifCls = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-blue-600 text-white';
  var pasifCls = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  var tamamCls = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  for (var i = 1; i <= 3; i++) {
    var btn = document.getElementById('adimBtn' + i);
    if (i === no) btn.className = aktifCls;
    else if (i < no) btn.className = tamamCls;
    else btn.className = pasifCls;
  }

  if (no === 2) fiyatGirisiOlustur();
  if (no === 3) onizlemeyiGuncelle();

  window.scrollTo(0, 0);
}

/* ── Veri Yukleme ── */

function urunleriYukle() {
  showLoading('Ürünler yükleniyor...');
  fetch('/api/etiket-ekrani/urunler')
    .then(function(r) {
      if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Sunucu hatası'); });
      return r.json();
    })
    .then(function(veri) {
      urunler = veri;
      urunListesiOlustur();
      hideLoading();
    })
    .catch(function(e) {
      hideLoading();
      bildirimGoster('hata', 'Yükleme Hatası', e.message);
    });
}

function ayarlariYukle() {
  fetch('/api/etiket-ekrani/ayarlar')
    .then(function(r) { return r.json(); })
    .then(function(veri) {
      if (!veri.error) {
        ayarlar = Object.assign({}, VARSAYILAN_AYARLAR, veri);
        ayarPaneliDoldur();
      }
    })
    .catch(function() {});
}

/* ── ADIM 1: Urun Listesi ── */

function urunListesiOlustur() {
  var arama = document.getElementById('aramaInput').value.toLowerCase();
  var kapsayici = document.getElementById('urunListesi');
  var html = '';

  var filtreli = urunler.filter(function(u) {
    if (!arama) return true;
    return (u.ad + ' ' + u.birim + ' ' + u.uretim_yeri).toLowerCase().indexOf(arama) > -1;
  });

  if (filtreli.length === 0) {
    html = '<div class="text-center py-8 text-gray-400">' +
      (arama ? 'Aramayla eşleşen ürün bulunamadı' : 'Ürün bulunamadı') + '</div>';
  } else {
    for (var i = 0; i < filtreli.length; i++) {
      var u = filtreli[i];
      var secili = seciliIdler.has(u.id);
      var bgCls = secili ? 'bg-blue-50 dark:bg-blue-900/20' : '';
      html += '<label class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ' + bgCls + '">' +
        '<input type="checkbox" data-urun-id="' + kacir(u.id) + '" ' + (secili ? 'checked' : '') +
        ' class="urun-checkbox w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="font-medium text-gray-800 dark:text-gray-100 truncate">' + kacir(u.ad) + '</div>' +
        '<div class="text-xs text-gray-500 dark:text-gray-400">' + kacir(u.birim) + ' · ' + kacir(u.uretim_yeri) + '</div>' +
        '</div>' +
        '</label>';
    }
  }
  kapsayici.innerHTML = html;
  secimSayisiniGuncelle();
}

function secimSayisiniGuncelle() {
  document.getElementById('secimSayisi').textContent = seciliIdler.size + ' ürün seçili';
  document.getElementById('adim1Devam').disabled = seciliIdler.size === 0;

  var tumunuSecKutu = document.getElementById('tumunuSecKutu');
  if (urunler.length > 0 && seciliIdler.size === urunler.length) {
    tumunuSecKutu.checked = true;
    tumunuSecKutu.indeterminate = false;
  } else if (seciliIdler.size > 0) {
    tumunuSecKutu.checked = false;
    tumunuSecKutu.indeterminate = true;
  } else {
    tumunuSecKutu.checked = false;
    tumunuSecKutu.indeterminate = false;
  }
}

/* ── ADIM 2: Fiyat Girisi ── */

function fiyatGirisiOlustur() {
  var kapsayici = document.getElementById('fiyatListesi');
  var html = '';

  var seciliUrunler = urunler.filter(function(u) { return seciliIdler.has(u.id); });

  for (var i = 0; i < seciliUrunler.length; i++) {
    var u = seciliUrunler[i];
    var mevcutFiyat = fiyatlar[u.id] || '';
    html += '<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">' +
      '<div class="flex-1 min-w-0">' +
      '<div class="font-medium text-gray-800 dark:text-gray-100">' + kacir(u.ad) + '</div>' +
      '<div class="text-xs text-gray-500 dark:text-gray-400">' + kacir(u.birim) + '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 w-full sm:w-auto">' +
      '<span class="text-lg font-semibold text-gray-600 dark:text-gray-400">₺</span>' +
      '<input type="number" step="0.01" min="0" placeholder="0,00" data-fiyat-id="' + kacir(u.id) + '" ' +
      'value="' + kacir(mevcutFiyat) + '" ' +
      'class="fiyat-input w-full sm:w-32 px-3 py-3 text-lg font-semibold text-right rounded-lg border border-gray-300 dark:border-gray-600 ' +
      'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">' +
      '</div>' +
      '</div>';
  }

  kapsayici.innerHTML = html;
  fiyatDurumunuKontrolEt();

  var ilkInput = kapsayici.querySelector('.fiyat-input');
  if (ilkInput) setTimeout(function() { ilkInput.focus(); }, 100);
}

function fiyatDurumunuKontrolEt() {
  var hepsiDolu = true;
  seciliIdler.forEach(function(id) {
    if (!fiyatlar[id] || fiyatlar[id] === '' || Number(fiyatlar[id]) <= 0) hepsiDolu = false;
  });
  document.getElementById('adim2Devam').disabled = !hepsiDolu;
}

/* ── ADIM 3: Onizleme ── */

function onizlemeyiGuncelle() {
  var kapsayici = document.getElementById('etiketOnizleme');
  kapsayici.innerHTML = '';

  var seciliUrunler = urunler.filter(function(u) { return seciliIdler.has(u.id); });
  document.getElementById('etiketSayisi').textContent = seciliUrunler.length;
  document.getElementById('yakinlastirmaDeger').textContent = Math.round(olcek * 100) + '%';

  for (var i = 0; i < seciliUrunler.length; i++) {
    var u = seciliUrunler[i];
    kapsayici.appendChild(etiketOlustur(u, fiyatlar[u.id], olcek));
  }
}

function etiketOlustur(urun, fiyat, s) {
  var genislik = ayarlar.etiket_genislik;
  var yukseklik = ayarlar.etiket_yukseklik;
  var ic = ayarlar.ic_bosluk;

  var div = document.createElement('div');
  div.className = 'etiket-kutu bg-white border border-gray-300 dark:border-gray-500 flex flex-col justify-between';
  div.style.cssText = 'width:' + (genislik * s) + 'mm;height:' + (yukseklik * s) + 'mm;padding:' + (ic * s) + 'mm;page-break-inside:avoid;box-sizing:border-box;color:#000;background:#fff;';

  var urunAdi = document.createElement('div');
  urunAdi.style.cssText = yaziStili('urun_adi', s) + 'text-align:center;line-height:1.2;';
  urunAdi.textContent = urun.ad;

  var fiyatDiv = document.createElement('div');
  fiyatDiv.style.cssText = 'text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;';

  var fiyatYazi = document.createElement('div');
  fiyatYazi.style.cssText = yaziStili('fiyat', s) + 'line-height:1;';
  fiyatYazi.textContent = '₺' + fiyatBicimle(fiyat);

  var birimYazi = document.createElement('div');
  birimYazi.style.cssText = yaziStili('birim', s) + 'line-height:1.3;margin-top:' + (1 * s) + 'mm;';
  birimYazi.textContent = urun.birim;

  fiyatDiv.appendChild(fiyatYazi);
  fiyatDiv.appendChild(birimYazi);

  var altBlok = document.createElement('div');
  altBlok.style.cssText = yaziStili('alt_metin', s) + 'text-align:center;line-height:1.3;';

  var uretimYer = document.createElement('div');
  uretimYer.textContent = urun.uretim_yeri;

  var tarihEl = document.createElement('div');
  tarihEl.textContent = bugunTarih();

  altBlok.appendChild(uretimYer);
  altBlok.appendChild(tarihEl);

  div.appendChild(urunAdi);
  div.appendChild(fiyatDiv);
  div.appendChild(altBlok);

  return div;
}

function yaziStili(alan, s) {
  return 'font-family:' + ayarlar[alan + '_yazi_tipi'] + ';' +
    'font-size:' + (ayarlar[alan + '_boyut'] * s) + 'px;' +
    'font-weight:' + (ayarlar[alan + '_kalin'] ? 'bold' : 'normal') + ';';
}

function fiyatBicimle(deger) {
  var sayi = parseFloat(deger);
  if (isNaN(sayi)) return '0,00';
  return sayi.toFixed(2).replace('.', ',');
}

function yakinlastir(delta) {
  olcek = Math.min(5, Math.max(1, olcek + delta));
  onizlemeyiGuncelle();
}

/* ── Ayarlar ── */

var YAZI_ALANLARI = [
  { anahtar: 'urun_adi', baslik: 'Ürün Adı' },
  { anahtar: 'fiyat', baslik: 'Fiyat' },
  { anahtar: 'birim', baslik: 'Birim' },
  { anahtar: 'alt_metin', baslik: 'Alt Metin (Üretim Yeri & Tarih)' },
];

function ayarPaneliniOlustur() {
  var kapsayici = document.getElementById('yaziAyarlariKapsayici');
  var html = '';

  for (var i = 0; i < YAZI_ALANLARI.length; i++) {
    var alan = YAZI_ALANLARI[i];
    var k = alan.anahtar;
    html += '<div class="pt-3 border-t border-gray-200 dark:border-gray-700">' +
      '<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">' + alan.baslik + '</h3>' +
      '<div class="grid grid-cols-3 gap-3">' +
      '<div>' +
      '<label class="text-xs text-gray-500 dark:text-gray-400">Yazı Tipi</label>' +
      '<select id="ayar_' + k + '_yazi_tipi" class="ayar-input w-full px-3 py-2 text-base rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">' +
      yaziTipiSecenekleri() +
      '</select>' +
      '</div>' +
      '<div>' +
      '<label class="text-xs text-gray-500 dark:text-gray-400">Boyut (px)</label>' +
      '<input type="number" min="6" max="72" id="ayar_' + k + '_boyut" class="ayar-input w-full px-3 py-2 text-base rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">' +
      '</div>' +
      '<div class="flex items-end pb-1">' +
      '<label class="flex items-center gap-2 cursor-pointer">' +
      '<input type="checkbox" id="ayar_' + k + '_kalin" class="ayar-checkbox w-5 h-5 text-blue-600 rounded focus:ring-blue-500">' +
      '<span class="text-sm text-gray-700 dark:text-gray-300">Kalın</span>' +
      '</label>' +
      '</div>' +
      '</div>' +
      '</div>';
  }
  kapsayici.innerHTML = html;
}

function yaziTipiSecenekleri() {
  var html = '';
  for (var i = 0; i < YAZI_TIPLERI.length; i++) {
    html += '<option value="' + kacir(YAZI_TIPLERI[i]) + '">' + kacir(YAZI_TIPLERI[i]) + '</option>';
  }
  return html;
}

function ayarPaneliDoldur() {
  var inputlar = document.querySelectorAll('.ayar-input');
  for (var i = 0; i < inputlar.length; i++) {
    var el = inputlar[i];
    var anahtar = el.id.replace('ayar_', '');
    if (anahtar && ayarlar[anahtar] !== undefined) {
      el.value = ayarlar[anahtar];
    }
  }
  var checklar = document.querySelectorAll('.ayar-checkbox');
  for (var j = 0; j < checklar.length; j++) {
    var cb = checklar[j];
    var cbAnahtar = cb.id.replace('ayar_', '');
    if (cbAnahtar && ayarlar[cbAnahtar] !== undefined) {
      cb.checked = ayarlar[cbAnahtar];
    }
  }
}

function ayarDegisti(e) {
  var el = e.target;
  if (!el.id || !el.id.startsWith('ayar_')) return;
  var anahtar = el.id.replace('ayar_', '');

  if (el.type === 'checkbox') {
    ayarlar[anahtar] = el.checked;
  } else if (el.type === 'number') {
    ayarlar[anahtar] = Number(el.value);
  } else {
    ayarlar[anahtar] = el.value;
  }

  if (!document.getElementById('adim3').classList.contains('hidden')) {
    onizlemeyiGuncelle();
  }
}

function ayarlariKaydet() {
  showLoading('Ayarlar kaydediliyor...');
  fetch('/api/etiket-ekrani/ayarlar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ayarlar),
  })
    .then(function(r) { return r.json(); })
    .then(function(veri) {
      hideLoading();
      if (veri.ok) bildirimGoster('basarili', 'Kaydedildi', 'Ayarlar başarıyla kaydedildi');
      else bildirimGoster('hata', 'Hata', veri.error || 'Kaydetme hatası');
    })
    .catch(function(e) {
      hideLoading();
      bildirimGoster('hata', 'Hata', e.message);
    });
}

function ayarlariSifirla() {
  ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
  ayarPaneliDoldur();
  ayarlariKaydet();
  if (!document.getElementById('adim3').classList.contains('hidden')) {
    onizlemeyiGuncelle();
  }
}

/* ── Yazdirma ── */

function yazdir() {
  var btn = document.getElementById('yazdirBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Hazırlanıyor...';

  var seciliUrunler = urunler.filter(function(u) { return seciliIdler.has(u.id); });
  if (seciliUrunler.length === 0) {
    bildirimGoster('hata', 'Hata', 'Yazdırmak için ürün seçin');
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-printer mr-1"></i>Tarayıcıdan Yazdır';
    return;
  }

  var alan = document.getElementById('yazdirAlani');
  alan.innerHTML = '';

  for (var i = 0; i < seciliUrunler.length; i++) {
    var etiket = etiketOlustur(seciliUrunler[i], fiyatlar[seciliUrunler[i].id], 1);
    etiket.style.width = ayarlar.etiket_genislik + 'mm';
    etiket.style.height = ayarlar.etiket_yukseklik + 'mm';
    etiket.style.padding = ayarlar.ic_bosluk + 'mm';
    etiket.style.pageBreakAfter = 'always';
    etiket.style.border = 'none';
    etiket.style.margin = '0';
    alan.appendChild(etiket);
  }

  var stil = document.createElement('style');
  stil.id = 'yazdir-stili';
  stil.textContent = '@media print { @page { size: ' + ayarlar.etiket_genislik + 'mm ' + ayarlar.etiket_yukseklik + 'mm; margin: 0; } ' +
    'body { margin: 0; padding: 0; } ' +
    '#yazdirAlani { display: block !important; } ' +
    '.etiket-kutu { border: none !important; margin: 0 !important; } }';
  document.head.appendChild(stil);

  alan.classList.remove('hidden');

  setTimeout(function() {
    window.print();
    alan.classList.add('hidden');
    var eskiStil = document.getElementById('yazdir-stili');
    if (eskiStil) eskiStil.remove();
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-printer mr-1"></i>Tarayıcıdan Yazdır';
  }, 200);
}

function basimGonder() {
  var btn = document.getElementById('basimBtn');
  var seciliUrunler = urunler.filter(function(u) { return seciliIdler.has(u.id); });
  if (seciliUrunler.length === 0) {
    bildirimGoster('hata', 'Hata', 'Göndermek için ürün seçin');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Gönderiliyor...';
  showLoading('Etiketler yazıcıya gönderiliyor...');

  var etiketler = seciliUrunler.map(function(u) {
    return { id: u.id, ad: u.ad, fiyat: fiyatlar[u.id] || '0' };
  });

  fetch('/api/etiket-ekrani/bas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etiketler: etiketler }),
  })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Sunucu hatası'); });
      return r.json();
    })
    .then(function(veri) {
      hideLoading();
      bildirimGoster('basarili', 'Gönderildi', veri.mesaj);
    })
    .catch(function(e) {
      hideLoading();
      bildirimGoster('hata', 'Gönderim Hatası', e.message);
    })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-paper-plane-tilt mr-1"></i>Yazıcıya Gönder';
    });
}

/* ── Olay Dinleyiciler ── */

document.addEventListener('DOMContentLoaded', function() {
  ayarPaneliniOlustur();
  urunleriYukle();
  ayarlariYukle();

  document.getElementById('aramaInput').addEventListener('input', function() {
    urunListesiOlustur();
  });

  document.getElementById('tumunuSecKutu').addEventListener('change', function() {
    var arama = document.getElementById('aramaInput').value.toLowerCase();
    var filtreli = urunler.filter(function(u) {
      if (!arama) return true;
      return (u.ad + ' ' + u.birim + ' ' + u.uretim_yeri).toLowerCase().indexOf(arama) > -1;
    });

    if (this.checked) {
      filtreli.forEach(function(u) { seciliIdler.add(u.id); });
    } else {
      filtreli.forEach(function(u) { seciliIdler.delete(u.id); });
    }
    urunListesiOlustur();
  });

  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('urun-checkbox')) {
      var id = e.target.getAttribute('data-urun-id');
      if (e.target.checked) seciliIdler.add(id);
      else seciliIdler.delete(id);
      urunListesiOlustur();
    }

    if (e.target.classList.contains('ayar-input') || e.target.classList.contains('ayar-checkbox')) {
      ayarDegisti(e);
    }
  });

  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('fiyat-input')) {
      var id = e.target.getAttribute('data-fiyat-id');
      fiyatlar[id] = e.target.value;
      fiyatDurumunuKontrolEt();
    }

    if (e.target.classList.contains('ayar-input') && e.target.type === 'number') {
      ayarDegisti(e);
    }
  });
});
