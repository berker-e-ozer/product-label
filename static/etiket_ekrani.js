/* Etiket Ekrani - istemci tarafi */

var siparisler = [];
var seciliAnahtarlar = new Set();
var ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
var olcek = 3;
var mesajZamanlayici = null;

/* ── Yardimcilar ── */

function kacir(metin) {
  if (!metin) return '';
  var div = document.createElement('div');
  div.textContent = String(metin);
  return div.innerHTML;
}

function tarihBicimle(isoStr) {
  if (!isoStr) return '';
  try {
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return kacir(isoStr);
    var gun = ('0' + d.getDate()).slice(-2);
    var ay = ('0' + (d.getMonth() + 1)).slice(-2);
    return gun + '.' + ay + '.' + d.getFullYear();
  } catch (_) {
    return kacir(isoStr);
  }
}

/* ── Mesaj Sistemi ── */

function mesajGoster(tip, baslik, metin) {
  var kutu = document.getElementById('mesaj-kutusu');
  var icerik = document.getElementById('mesaj-icerik');
  var ikon = document.getElementById('mesaj-ikon');
  document.getElementById('mesaj-baslik').textContent = baslik;
  document.getElementById('mesaj-metin').textContent = metin;

  icerik.className = 'rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 ';
  if (tip === 'hata') {
    icerik.className += 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    ikon.className = 'ph ph-warning-circle text-xl flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400';
  } else {
    icerik.className += 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    ikon.className = 'ph ph-check-circle text-xl flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400';
  }

  kutu.classList.remove('hidden');
  if (mesajZamanlayici) clearTimeout(mesajZamanlayici);
  mesajZamanlayici = setTimeout(mesajKapat, 5000);
}

function mesajKapat() {
  document.getElementById('mesaj-kutusu').classList.add('hidden');
  if (mesajZamanlayici) { clearTimeout(mesajZamanlayici); mesajZamanlayici = null; }
}

/* ── Sekme Yonetimi ── */

function sekmeGoster(ad) {
  var siparisDiv = document.getElementById('bolum-siparisler');
  var onizlemeDiv = document.getElementById('bolum-onizleme');
  var sekmeSip = document.getElementById('sekme-siparisler');
  var sekmeOn = document.getElementById('sekme-onizleme');

  var aktifCls = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white';
  var pasifCls = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400';

  if (ad === 'siparisler') {
    siparisDiv.classList.remove('hidden');
    onizlemeDiv.classList.add('hidden');
    sekmeSip.className = aktifCls;
    sekmeOn.className = pasifCls;
  } else {
    siparisDiv.classList.add('hidden');
    onizlemeDiv.classList.remove('hidden');
    sekmeSip.className = pasifCls;
    sekmeOn.className = aktifCls;
    onizlemeyiGuncelle();
  }
}

/* ── Veri Yukleme ── */

function siparisleriYukle() {
  showLoading('Siparişler yükleniyor...');
  fetch('/api/etiket-ekrani/siparisler')
    .then(function(r) {
      if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Sunucu hatası'); });
      return r.json();
    })
    .then(function(veri) {
      siparisler = veri;
      tabloOlustur();
      hideLoading();
    })
    .catch(function(e) {
      hideLoading();
      mesajGoster('hata', 'Yükleme Hatası', e.message);
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

function ayarlariKaydet() {
  fetch('/api/etiket-ekrani/ayarlar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ayarlar),
  }).catch(function() {});
}

/* ── Siparis Tablosu ── */

function tabloOlustur() {
  var arama = document.getElementById('arama').value.toLowerCase();
  var tbody = document.getElementById('siparis-listesi');
  var html = '';

  var filtreli = siparisler.filter(function(s) {
    if (!arama) return true;
    return (s.no + ' ' + s.musteri + ' ' + (s.alici || '') + ' ' + s.kargo.firma + ' ' + s.kargo.il).toLowerCase().indexOf(arama) > -1;
  });

  if (filtreli.length === 0) {
    html = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">' +
      (arama ? 'Aramayla eşleşen sipariş bulunamadı' : 'Sipariş bulunamadı') + '</td></tr>';
  } else {
    for (var i = 0; i < filtreli.length; i++) {
      var s = filtreli[i];
      var secili = seciliAnahtarlar.has(s.anahtar);
      var satirCls = secili ? 'bg-blue-50 dark:bg-blue-900/20' : '';
      var ikonCls = secili ? 'ph ph-check-square text-xl text-blue-600 dark:text-blue-400' : 'ph ph-square text-xl';
      var aliciGosterim = s.alici ? ' → ' + kacir(s.alici) : '';
      html += '<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ' + satirCls + '" onclick="satirTikla(\'' + kacir(s.anahtar) + '\')">' +
        '<td class="px-3 py-3"><i class="' + ikonCls + '"></i></td>' +
        '<td class="px-3 py-3 font-medium">' + kacir(s.no) + '</td>' +
        '<td class="px-3 py-3">' + kacir(s.musteri) + aliciGosterim + '</td>' +
        '<td class="px-3 py-3 hidden sm:table-cell">' + kacir(s.kargo.firma) + '</td>' +
        '<td class="px-3 py-3 hidden md:table-cell">' + kacir(s.kargo.il) + ' / ' + kacir(s.kargo.ilce) + '</td>' +
        '<td class="px-3 py-3 hidden lg:table-cell">' + tarihBicimle(s.tarih) + '</td>' +
        '</tr>';
    }
  }
  tbody.innerHTML = html;
  secimSayisiniGuncelle();
}

function satirTikla(anahtar) {
  if (seciliAnahtarlar.has(anahtar)) {
    seciliAnahtarlar.delete(anahtar);
  } else {
    seciliAnahtarlar.add(anahtar);
  }
  tabloOlustur();
}

function tumunuSec() {
  var arama = document.getElementById('arama').value.toLowerCase();
  var filtreli = siparisler.filter(function(s) {
    if (!arama) return true;
    return (s.no + ' ' + s.musteri + ' ' + s.kargo.firma + ' ' + s.kargo.il).toLowerCase().indexOf(arama) > -1;
  });

  var hepsiSecili = filtreli.length > 0 && filtreli.every(function(s) { return seciliAnahtarlar.has(s.anahtar); });

  if (hepsiSecili) {
    filtreli.forEach(function(s) { seciliAnahtarlar.delete(s.anahtar); });
  } else {
    filtreli.forEach(function(s) { seciliAnahtarlar.add(s.anahtar); });
  }
  tabloOlustur();
}

function secimSayisiniGuncelle() {
  var el = document.getElementById('secim-sayisi');
  el.textContent = seciliAnahtarlar.size + ' / ' + siparisler.length + ' seçili';

  var btn = document.getElementById('devam-btn');
  btn.disabled = seciliAnahtarlar.size === 0;

  var topluIkon = document.getElementById('toplu-sec-ikon');
  if (siparisler.length > 0 && seciliAnahtarlar.size === siparisler.length) {
    topluIkon.className = 'ph ph-check-square text-xl text-blue-600 dark:text-blue-400';
  } else {
    topluIkon.className = 'ph ph-square text-xl';
  }
}

/* ── Ayarlar Paneli ── */

var YAZI_ALANLARI = [
  { anahtar: 'siparis_no', baslik: 'Sipariş No' },
  { anahtar: 'musteri', baslik: 'Müşteri / Alıcı' },
  { anahtar: 'kargo', baslik: 'Kargo Firması' },
  { anahtar: 'adres', baslik: 'Adres (İl / İlçe)' },
  { anahtar: 'tarih', baslik: 'Tarih' },
];

function ayarPaneliniOlustur() {
  var kapsayici = document.getElementById('yazi-ayarlari-container');
  var html = '';

  for (var i = 0; i < YAZI_ALANLARI.length; i++) {
    var alan = YAZI_ALANLARI[i];
    var k = alan.anahtar;
    html += '<fieldset class="mb-4">' +
      '<legend class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">' + alan.baslik + '</legend>' +
      '<div class="grid grid-cols-3 gap-3">' +
      '<div>' +
      '<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Yazı Tipi</label>' +
      '<select data-ayar="' + k + '_yazi_tipi" class="ayar-input w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none">' +
      yaziTipiSecenekleri() +
      '</select>' +
      '</div>' +
      '<div>' +
      '<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Boyut (px)</label>' +
      '<input type="number" min="6" max="48" data-ayar="' + k + '_boyut" class="ayar-input w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none">' +
      '</div>' +
      '<div class="flex items-end pb-1">' +
      '<label class="flex items-center gap-2 cursor-pointer">' +
      '<input type="checkbox" data-ayar="' + k + '_kalin" class="ayar-checkbox w-5 h-5 text-purple-600 rounded focus:ring-purple-500">' +
      '<span class="text-sm">Kalın</span>' +
      '</label>' +
      '</div>' +
      '</div>' +
      '</fieldset>';
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
    var anahtar = el.getAttribute('data-ayar');
    if (anahtar && ayarlar[anahtar] !== undefined) {
      el.value = ayarlar[anahtar];
    }
  }
  var checklar = document.querySelectorAll('.ayar-checkbox');
  for (var j = 0; j < checklar.length; j++) {
    var cb = checklar[j];
    var cbAnahtar = cb.getAttribute('data-ayar');
    if (cbAnahtar && ayarlar[cbAnahtar] !== undefined) {
      cb.checked = ayarlar[cbAnahtar];
    }
  }
  boyutBilgisiGuncelle();
}

function ayarDegisti(e) {
  var el = e.target;
  var anahtar = el.getAttribute('data-ayar');
  if (!anahtar) return;

  if (el.type === 'checkbox') {
    ayarlar[anahtar] = el.checked;
  } else if (el.type === 'number') {
    ayarlar[anahtar] = Number(el.value);
  } else {
    ayarlar[anahtar] = el.value;
  }
  boyutBilgisiGuncelle();
  ayarlariKaydet();

  if (document.getElementById('bolum-onizleme').classList.contains('hidden') === false) {
    onizlemeyiGuncelle();
  }
}

function ayarlariSifirla() {
  ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
  ayarPaneliDoldur();
  ayarlariKaydet();
  onizlemeyiGuncelle();
}

function boyutBilgisiGuncelle() {
  var el = document.getElementById('boyut-bilgi');
  if (el) el.textContent = ayarlar.etiket_genislik + 'mm × ' + ayarlar.etiket_yukseklik + 'mm';
}

/* ── Etiket Render ── */

function etiketHTML(siparis, s) {
  var genislik = ayarlar.etiket_genislik;
  var yukseklik = ayarlar.etiket_yukseklik;
  var ic = ayarlar.ic_bosluk;
  var alici = siparis.alici || siparis.musteri;

  var div = document.createElement('div');
  div.className = 'etiket-kutu bg-white border border-gray-300 dark:border-gray-500 flex flex-col justify-between';
  div.style.cssText = 'width:' + (genislik * s) + 'mm;height:' + (yukseklik * s) + 'mm;padding:' + (ic * s) + 'mm;page-break-inside:avoid;box-sizing:border-box;';

  var ust = document.createElement('div');
  ust.style.cssText = yaziStili('siparis_no', s) + 'text-align:center;line-height:1.3;';
  ust.textContent = siparis.no;

  var musteri = document.createElement('div');
  musteri.style.cssText = yaziStili('musteri', s) + 'text-align:center;line-height:1.3;margin-top:' + (1 * s) + 'mm;';
  musteri.textContent = alici;

  var kargo = document.createElement('div');
  kargo.style.cssText = yaziStili('kargo', s) + 'text-align:center;line-height:1;margin:' + (2 * s) + 'mm 0;flex:1;display:flex;align-items:center;justify-content:center;';
  kargo.textContent = siparis.kargo.firma;

  var adres = document.createElement('div');
  adres.style.cssText = yaziStili('adres', s) + 'line-height:1.3;';
  adres.textContent = siparis.kargo.il + ' / ' + siparis.kargo.ilce;

  var tarih = document.createElement('div');
  tarih.style.cssText = yaziStili('tarih', s) + 'line-height:1.3;';
  tarih.textContent = tarihBicimle(siparis.tarih);

  var altBlok = document.createElement('div');
  altBlok.appendChild(adres);
  altBlok.appendChild(tarih);

  div.appendChild(ust);
  div.appendChild(musteri);
  div.appendChild(kargo);
  div.appendChild(altBlok);

  return div;
}

function yaziStili(alan, s) {
  return 'font-family:' + ayarlar[alan + '_yazi_tipi'] + ';' +
    'font-size:' + (ayarlar[alan + '_boyut'] * s) + 'px;' +
    'font-weight:' + (ayarlar[alan + '_kalin'] ? 'bold' : 'normal') + ';';
}

/* ── Onizleme ── */

function onizlemeyiGuncelle() {
  var kapsayici = document.getElementById('onizleme-etiketler');
  kapsayici.innerHTML = '';

  var secili = siparisler.filter(function(s) { return seciliAnahtarlar.has(s.anahtar); });
  document.getElementById('etiket-sayisi').textContent = secili.length;

  for (var i = 0; i < secili.length; i++) {
    kapsayici.appendChild(etiketHTML(secili[i], olcek));
  }

  document.getElementById('yakinlastirma-deger').textContent = Math.round(olcek * 100) + '%';
}

function yakinlastir(delta) {
  olcek = Math.min(5, Math.max(1, olcek + delta));
  onizlemeyiGuncelle();
}

/* ── Yazdirma ── */

function tarayicidanYazdir() {
  var btn = document.getElementById('btn-tarayici-yazdir');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Hazırlanıyor...';

  var secili = siparisler.filter(function(s) { return seciliAnahtarlar.has(s.anahtar); });
  if (secili.length === 0) {
    mesajGoster('hata', 'Hata', 'Yazdırmak için en az bir sipariş seçin');
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-printer"></i> Tarayıcıdan Yazdır';
    return;
  }

  var alan = document.getElementById('yazdir-alani');
  alan.innerHTML = '';

  for (var i = 0; i < secili.length; i++) {
    var etiket = etiketHTML(secili[i], 1);
    etiket.style.width = ayarlar.etiket_genislik + 'mm';
    etiket.style.height = ayarlar.etiket_yukseklik + 'mm';
    etiket.style.padding = ayarlar.ic_bosluk + 'mm';
    etiket.style.pageBreakAfter = 'always';
    etiket.style.border = 'none';
    etiket.style.margin = '0';
    etiket.style.color = '#000';
    etiket.style.backgroundColor = '#fff';
    alan.appendChild(etiket);
  }

  var stil = document.createElement('style');
  stil.id = 'yazdir-stili';
  stil.textContent = '@media print { @page { size: ' + ayarlar.etiket_genislik + 'mm ' + ayarlar.etiket_yukseklik + 'mm; margin: 0; } ' +
    'body { margin: 0; padding: 0; } ' +
    '#yazdir-alani { display: block !important; } ' +
    '.etiket-kutu { width: ' + ayarlar.etiket_genislik + 'mm !important; height: ' + ayarlar.etiket_yukseklik + 'mm !important; padding: ' + ayarlar.ic_bosluk + 'mm !important; border: none !important; margin: 0 !important; color: #000 !important; background: #fff !important; } }';
  document.head.appendChild(stil);

  alan.classList.remove('hidden');

  setTimeout(function() {
    window.print();
    alan.classList.add('hidden');
    var eskiStil = document.getElementById('yazdir-stili');
    if (eskiStil) eskiStil.remove();
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-printer"></i> Tarayıcıdan Yazdır';
  }, 200);
}

function yaziciyaGonder() {
  var btn = document.getElementById('btn-yazici-gonder');
  var secili = siparisler.filter(function(s) { return seciliAnahtarlar.has(s.anahtar); });
  if (secili.length === 0) {
    mesajGoster('hata', 'Hata', 'Göndermek için en az bir sipariş seçin');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Gönderiliyor...';
  showLoading('Etiketler yazıcıya gönderiliyor...');

  var anahtarlar = secili.map(function(s) { return s.anahtar; });

  fetch('/api/etiket-ekrani/bas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anahtarlar: anahtarlar }),
  })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Sunucu hatası'); });
      return r.json();
    })
    .then(function(veri) {
      hideLoading();
      mesajGoster('basarili', 'Gönderildi', veri.mesaj);
    })
    .catch(function(e) {
      hideLoading();
      mesajGoster('hata', 'Gönderim Hatası', e.message);
    })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Yazıcıya Gönder';
    });
}

/* ── Olay Dinleyiciler ── */

document.addEventListener('DOMContentLoaded', function() {
  ayarPaneliniOlustur();
  siparisleriYukle();
  ayarlariYukle();

  document.getElementById('arama').addEventListener('input', function() {
    tabloOlustur();
  });

  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('ayar-input') || e.target.classList.contains('ayar-checkbox')) {
      ayarDegisti(e);
    }
  });
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('ayar-input') && e.target.type === 'number') {
      ayarDegisti(e);
    }
  });
});
