/* Urun Etiket Ekrani - istemci tarafi */

var urunler = [];
var seciliIdler = new Set();
var fiyatlar = {};
var birimler = {};
var ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
var olcek = 2;
var aktifAdim = 1;
var bildirimZamanlayici = null;

var YAZI_ALANLARI = [
  { anahtar: 'urun_adi', baslik: 'Ürün Adı' },
  { anahtar: 'fiyat', baslik: 'Fiyat' },
  { anahtar: 'birim', baslik: 'Birim' },
  { anahtar: 'alt_metin', baslik: 'Alt Metin (Üretim Yeri & Tarih)' },
];

/* ── Yardimcilar ── */

function kacir(metin) {
  if (metin === null || metin === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(metin);
  return div.innerHTML;
}

var VARSAYILAN_BIRIMLER = ['TL/kg', 'TL/500g', 'TL/250g', 'TL/100g', 'TL/Adet', 'TL/Paket'];

function bugunTarih() {
  var d = new Date();
  return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
}

function tarihBicimle(iso) {
  var p = String(iso || '').split('-');
  return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : '';
}

function fiyatSistemdenFarkli(urun) {
  if (!sistemFiyatiVar(urun)) return true;
  return Math.abs(fiyatSayi(fiyatlar[urun.id]) - fiyatSayi(urun.fiyat)) >= 0.005;
}

function birimSistemdenFarkli(urun) {
  return (birimler[urun.id] || '').trim() !== (urun.birim || '').trim();
}

/* Fiyat degistiyse etikete bugunun tarihi, degismediyse sistemdeki fiyat degisiklik tarihi basilir */
function etiketTarihi(urun) {
  if (fiyatSistemdenFarkli(urun) || !urun.fiyat_tarihi) return bugunTarih();
  return tarihBicimle(urun.fiyat_tarihi);
}

function birimSecenekleriniDoldur() {
  var hepsi = VARSAYILAN_BIRIMLER.slice();
  urunler.forEach(function(u) { if (u.birim && hepsi.indexOf(u.birim) === -1) hepsi.push(u.birim); });
  document.getElementById('birimSecenekleri').innerHTML = hepsi.map(function(b) {
    return '<option value="' + kacir(b) + '"></option>';
  }).join('');
}

function fiyatSayi(deger) {
  if (deger === null || deger === undefined || deger === '') return NaN;
  return parseFloat(String(deger).replace(/\s/g, '').replace(',', '.'));
}

function fiyatBicimle(deger) {
  var sayi = fiyatSayi(deger);
  if (isNaN(sayi)) return '';
  if (Math.abs(sayi - Math.round(sayi)) < 0.005) return String(Math.round(sayi));
  return sayi.toFixed(2).replace('.', ',');
}

function sistemFiyatiVar(urun) {
  return urun.fiyat !== null && urun.fiyat !== undefined && !isNaN(fiyatSayi(urun.fiyat));
}

function urunBul(id) {
  for (var i = 0; i < urunler.length; i++) if (urunler[i].id === id) return urunler[i];
  return null;
}

function seciliUrunler() {
  return urunler.filter(function(u) { return seciliIdler.has(u.id); });
}

function filtreliUrunler() {
  var arama = document.getElementById('aramaInput').value.toLocaleLowerCase('tr');
  return urunler.filter(function(u) {
    if (!arama) return true;
    return (u.ad + ' ' + u.birim + ' ' + u.uretim_yeri).toLocaleLowerCase('tr').indexOf(arama) > -1;
  });
}

function eksikFiyatVar() {
  var eksik = false;
  seciliIdler.forEach(function(id) {
    if (!(fiyatSayi(fiyatlar[id]) > 0)) eksik = true;
  });
  return eksik;
}

function butonMesgul(btn, mesgul, metin) {
  if (mesgul) {
    btn.dataset.eskiHtml = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = '⏳ ' + metin;
  } else {
    btn.disabled = false;
    if (btn.dataset.eskiHtml) btn.innerHTML = btn.dataset.eskiHtml;
  }
}

function jsonIste(url, secenekler) {
  return fetch(url, secenekler).then(function(r) {
    return r.json().catch(function() { return {}; }).then(function(j) {
      if (!r.ok || j.error) throw new Error(j.error || 'Sunucuya ulaşılamadı (' + r.status + ')');
      return j;
    });
  });
}

/* ── Bildirim ── */

function bildirimGoster(tip, baslik, metin) {
  var icerik = document.getElementById('bildirimIcerik');
  var ikon = document.getElementById('bildirimIkon');
  document.getElementById('bildirimBaslik').textContent = baslik;
  document.getElementById('bildirimMetin').textContent = metin;

  if (tip === 'hata') {
    icerik.className = 'rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
    ikon.className = 'ph ph-warning-circle text-xl shrink-0 mt-0.5 text-red-600 dark:text-red-400';
  } else {
    icerik.className = 'rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
    ikon.className = 'ph ph-check-circle text-xl shrink-0 mt-0.5 text-green-600 dark:text-green-400';
  }

  document.getElementById('bildirim').classList.remove('hidden');
  if (bildirimZamanlayici) clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(bildirimKapat, 5000);
}

function bildirimKapat() {
  document.getElementById('bildirim').classList.add('hidden');
  if (bildirimZamanlayici) { clearTimeout(bildirimZamanlayici); bildirimZamanlayici = null; }
}

/* ── Adim Yonetimi ── */

function adimGit(no) {
  if (no >= 2 && seciliIdler.size === 0) {
    bildirimGoster('hata', 'Ürün seçilmedi', 'Devam etmek için en az bir ürün seçin.');
    return;
  }
  if (no === 3 && eksikFiyatVar()) {
    if (aktifAdim !== 2) adimGit(2);
    bildirimGoster('hata', 'Eksik fiyat', 'Seçili tüm ürünlere 0\'dan büyük bir fiyat girin.');
    return;
  }

  aktifAdim = no;
  for (var i = 1; i <= 3; i++) {
    document.getElementById('adim' + i).classList.toggle('hidden', i !== no);
  }
  adimGostergesiniGuncelle();

  if (no === 2) fiyatGirisiOlustur();
  if (no === 3) onizlemeyiGuncelle();

  window.scrollTo(0, 0);
}

function adimGostergesiniGuncelle() {
  var temel = 'adim-btn w-full min-h-11 flex items-center justify-center gap-2 px-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ';
  for (var i = 1; i <= 3; i++) {
    var btn = document.getElementById('adimBtn' + i);
    var no = btn.querySelector('.adim-no');
    var noTemel = 'adim-no w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ';
    if (i === aktifAdim) {
      btn.className = temel + 'bg-blue-600 text-white';
      no.className = noTemel + 'bg-white/25 text-white';
      no.textContent = i;
      btn.setAttribute('aria-current', 'step');
    } else if (i < aktifAdim) {
      btn.className = temel + 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50';
      no.className = noTemel + 'bg-green-600 text-white';
      no.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>';
      btn.removeAttribute('aria-current');
    } else {
      btn.className = temel + 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';
      no.className = noTemel + 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
      no.textContent = i;
      btn.removeAttribute('aria-current');
    }
  }
}

/* ── Veri Yukleme ── */

function urunleriYukle() {
  showLoading('Ürünler yükleniyor');
  jsonIste('/api/etiket-ekrani/urunler')
    .then(function(veri) {
      urunler = veri;
      urunler.forEach(function(u) {
        if (sistemFiyatiVar(u) && fiyatlar[u.id] === undefined) fiyatlar[u.id] = fiyatBicimle(u.fiyat);
        if (birimler[u.id] === undefined) birimler[u.id] = u.birim || '';
      });
      birimSecenekleriniDoldur();
      urunListesiOlustur();
    })
    .catch(function(e) {
      document.getElementById('urunListesi').innerHTML =
        '<p class="py-8 text-center text-red-700 dark:text-red-300">Ürünler yüklenemedi. Sayfayı yenileyip tekrar deneyin.</p>';
      bildirimGoster('hata', 'Yükleme hatası', e.message);
    })
    .finally(hideLoading);
}

function ayarlariYukle() {
  jsonIste('/api/etiket-ekrani/ayarlar')
    .then(function(veri) {
      ayarlar = Object.assign({}, VARSAYILAN_AYARLAR, veri);
      ayarPaneliDoldur();
      if (aktifAdim === 3) onizlemeyiGuncelle();
    })
    .catch(function(e) {
      bildirimGoster('hata', 'Ayarlar okunamadı', e.message + ' Varsayılan ayarlar kullanılıyor.');
    });
}

/* ── ADIM 1: Urun Listesi ── */

function urunListesiOlustur() {
  var filtreli = filtreliUrunler();
  var html = '';

  if (filtreli.length === 0) {
    html = '<p class="py-8 text-center text-gray-500 dark:text-gray-400">' +
      (urunler.length ? 'Aramayla eşleşen ürün bulunamadı' : 'Ürün bulunamadı') + '</p>';
  }

  for (var i = 0; i < filtreli.length; i++) {
    var u = filtreli[i];
    var secili = seciliIdler.has(u.id);
    var fiyatRozet = sistemFiyatiVar(u)
      ? '<span class="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">₺' + kacir(fiyatBicimle(u.fiyat)) + '</span>'
      : '<span class="text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Fiyat yok</span>';

    html += '<label class="flex items-center gap-3 px-3 py-2.5 min-h-14 cursor-pointer transition-colors duration-150 ' +
      (secili ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40') + '">' +
      '<input type="checkbox" data-urun-id="' + kacir(u.id) + '"' + (secili ? ' checked' : '') +
      ' class="urun-checkbox w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 shrink-0">' +
      '<span class="flex-1 min-w-0">' +
      '<span class="block font-medium text-gray-900 dark:text-gray-100 truncate">' + kacir(u.ad) + '</span>' +
      '<span class="block text-sm text-gray-600 dark:text-gray-400 truncate">' + kacir(u.birim) + ' · ' + kacir(u.uretim_yeri) + '</span>' +
      '</span>' + fiyatRozet +
      '</label>';
  }
  document.getElementById('urunListesi').innerHTML = html;
  secimSayisiniGuncelle();
}

function secimSayisiniGuncelle() {
  document.getElementById('secimSayisi').textContent = seciliIdler.size + ' seçili';
  document.getElementById('adim1Devam').disabled = seciliIdler.size === 0;

  var kutu = document.getElementById('tumunuSecKutu');
  var filtreli = filtreliUrunler();
  var seciliSayi = filtreli.filter(function(u) { return seciliIdler.has(u.id); }).length;
  kutu.checked = filtreli.length > 0 && seciliSayi === filtreli.length;
  kutu.indeterminate = seciliSayi > 0 && seciliSayi < filtreli.length;
}

/* ── ADIM 2: Fiyat Girisi ── */

function fiyatGirisiOlustur() {
  var html = '';
  var liste = seciliUrunler();

  for (var i = 0; i < liste.length; i++) {
    var u = liste[i];
    var fiyatId = 'fiyat_' + i;
    var birimId = 'birim_' + i;
    html += '<div data-satir="' + kacir(u.id) + '" class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">' +
      '<div class="font-medium text-gray-900 dark:text-gray-100">' + kacir(u.ad) + '</div>' +
      '<div class="text-sm text-gray-600 dark:text-gray-400">' + kacir(u.uretim_yeri) +
      (u.fiyat_tarihi ? ' · Son fiyat değişikliği ' + kacir(tarihBicimle(u.fiyat_tarihi)) : '') + '</div>' +
      '<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[10rem_10rem] gap-2 mt-2">' +
      '<div><label for="' + fiyatId + '" class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Fiyat</label>' +
      '<div class="relative">' +
      '<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold" aria-hidden="true">₺</span>' +
      '<input type="text" inputmode="decimal" autocomplete="off" id="' + fiyatId + '" data-fiyat-id="' + kacir(u.id) + '" ' +
      'value="' + kacir(fiyatlar[u.id] || '') + '" placeholder="0,00" ' +
      'class="fiyat-input w-full min-h-12 pl-8 pr-3 text-lg font-semibold text-right tabular-nums rounded-lg border border-gray-300 dark:border-gray-600 ' +
      'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">' +
      '</div></div>' +
      '<div><label for="' + birimId + '" class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Birim</label>' +
      '<input type="text" list="birimSecenekleri" autocomplete="off" id="' + birimId + '" data-birim-id="' + kacir(u.id) + '" ' +
      'value="' + kacir(birimler[u.id] || '') + '" placeholder="TL/kg" ' +
      'class="birim-input w-full min-h-12 px-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 ' +
      'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"></div>' +
      '</div>' +
      '<div class="fiyat-ipucu mt-2 text-sm"></div>' +
      '</div>';
  }

  var kapsayici = document.getElementById('fiyatListesi');
  kapsayici.innerHTML = html;
  kapsayici.querySelectorAll('[data-satir]').forEach(fiyatIpucuGuncelle);
  fiyatDurumunuKontrolEt();

  var ilkBos = Array.prototype.find.call(kapsayici.querySelectorAll('.fiyat-input'), function(el) { return !el.value; });
  if (ilkBos) ilkBos.focus();
}

function fiyatIpucuGuncelle(satir) {
  var urun = urunBul(satir.getAttribute('data-satir'));
  var input = satir.querySelector('.fiyat-input');
  var ipucu = satir.querySelector('.fiyat-ipucu');
  var girilen = fiyatSayi(input.value);
  var gecersiz = input.value !== '' && !(girilen > 0);

  input.classList.toggle('border-red-500', gecersiz);
  input.classList.toggle('dark:border-red-400', gecersiz);
  input.setAttribute('aria-invalid', gecersiz ? 'true' : 'false');

  if (gecersiz) {
    ipucu.innerHTML = '<span class="text-red-700 dark:text-red-300">Geçerli bir fiyat girin (ör. 24,90)</span>';
    return;
  }
  if (!sistemFiyatiVar(urun)) {
    ipucu.innerHTML = '<span class="text-amber-800 dark:text-amber-200">Sistemde fiyat yok, elle girin · etikete bugünün tarihi basılır</span>';
    return;
  }

  var farklar = [];
  if (fiyatSistemdenFarkli(urun)) farklar.push('fiyat (sistemde ₺' + kacir(fiyatBicimle(urun.fiyat)) + ')');
  if (birimSistemdenFarkli(urun)) farklar.push('birim (sistemde ' + kacir(urun.birim || 'boş') + ')');

  if (farklar.length === 0) {
    ipucu.innerHTML = '<span class="text-gray-600 dark:text-gray-400"><i class="ph ph-database mr-1" aria-hidden="true"></i>Sistemdeki fiyat ve birim</span>';
  } else {
    ipucu.innerHTML = '<span class="text-blue-700 dark:text-blue-300">Değiştirildi: ' + farklar.join(', ') +
      (fiyatSistemdenFarkli(urun) ? ' · etikete bugünün tarihi basılır' : '') + '</span> ' +
      '<button type="button" class="fiyat-geri min-h-11 px-2 -my-3 text-blue-700 dark:text-blue-300 underline underline-offset-2 cursor-pointer">Sisteme dön</button>';
  }
}

function fiyatDurumunuKontrolEt() {
  document.getElementById('adim2Devam').disabled = eksikFiyatVar();
}

/* ── ADIM 3: Onizleme ── */

function onizlemeyiGuncelle() {
  var kapsayici = document.getElementById('etiketOnizleme');
  kapsayici.innerHTML = '';
  var liste = seciliUrunler();
  document.getElementById('etiketSayisi').textContent = liste.length;
  document.getElementById('yakinlastirmaDeger').textContent = Math.round(olcek * 100) + '%';

  for (var i = 0; i < liste.length; i++) {
    var etiket = etiketOlustur(liste[i], olcek);
    etiket.classList.add('shadow-sm', 'ring-1', 'ring-gray-300', 'dark:ring-gray-600');
    kapsayici.appendChild(etiket);
  }
}

function etiketOlustur(urun, s) {
  var fiyat = fiyatlar[urun.id];
  var div = document.createElement('div');
  div.className = 'etiket-kutu';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.justifyContent = 'space-between';
  div.style.overflow = 'hidden';
  div.style.flexShrink = '0';
  div.style.background = '#fff';
  div.style.color = '#000';
  div.style.width = (ayarlar.etiket_genislik * s) + 'mm';
  div.style.height = (ayarlar.etiket_yukseklik * s) + 'mm';
  div.style.padding = (ayarlar.ic_bosluk * s) + 'mm';
  div.style.margin = (ayarlar.dis_bosluk * s) + 'mm';
  div.style.boxSizing = 'border-box';
  div.style.pageBreakInside = 'avoid';

  var urunAdi = document.createElement('div');
  urunAdi.style.cssText = yaziStili('urun_adi', s) + 'text-align:center;line-height:1.2;';
  urunAdi.textContent = urun.ad;

  var orta = document.createElement('div');
  orta.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;';

  var fiyatSatiri = document.createElement('div');
  fiyatSatiri.style.cssText = 'display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;column-gap:' + s + 'mm;line-height:1;';

  var fiyatYazi = document.createElement('span');
  fiyatYazi.style.cssText = yaziStili('fiyat', s);
  fiyatYazi.textContent = fiyatBicimle(fiyat);

  var birimYazi = document.createElement('span');
  birimYazi.style.cssText = yaziStili('birim', s);
  birimYazi.textContent = birimler[urun.id] || '';

  fiyatSatiri.appendChild(fiyatYazi);
  fiyatSatiri.appendChild(birimYazi);
  orta.appendChild(fiyatSatiri);

  var alt = document.createElement('div');
  alt.style.cssText = yaziStili('alt_metin', s) + 'text-align:left;line-height:1.3;';
  var yer = document.createElement('div');
  yer.textContent = 'Üretim Yeri: ' + (urun.uretim_yeri || '');
  var tarih = document.createElement('div');
  tarih.textContent = 'Fiyat Değişiklik Tarihi: ' + etiketTarihi(urun);
  alt.appendChild(yer);
  alt.appendChild(tarih);

  div.appendChild(urunAdi);
  div.appendChild(orta);
  div.appendChild(alt);
  return div;
}

function yaziStili(alan, s) {
  return 'font-family:"' + ayarlar[alan + '_yazi_tipi'] + '",sans-serif;' +
    'font-size:' + (ayarlar[alan + '_boyut'] * s) + 'px;' +
    'font-weight:' + (ayarlar[alan + '_kalin'] ? 'bold' : 'normal') + ';';
}

function yakinlastir(delta) {
  olcek = Math.min(5, Math.max(1, olcek + delta));
  onizlemeyiGuncelle();
}

/* ── Ayarlar ── */

function ayarPaneliniOlustur() {
  var secenekler = YAZI_TIPLERI.map(function(yt) {
    return '<option value="' + kacir(yt) + '">' + kacir(yt) + '</option>';
  }).join('');
  var girdi = 'w-full min-h-11 px-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none';

  var html = '';
  YAZI_ALANLARI.forEach(function(alan) {
    var k = alan.anahtar;
    html += '<fieldset class="pt-4 border-t border-gray-200 dark:border-gray-700">' +
      '<legend class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">' + alan.baslik + '</legend>' +
      '<div class="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">' +
      '<div><label for="ayar_' + k + '_yazi_tipi" class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Yazı tipi</label>' +
      '<select id="ayar_' + k + '_yazi_tipi" class="ayar-input ' + girdi + '">' + secenekler + '</select></div>' +
      '<div><label for="ayar_' + k + '_boyut" class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Boyut (px)</label>' +
      '<input type="number" inputmode="numeric" min="6" max="72" id="ayar_' + k + '_boyut" class="ayar-input ' + girdi + '"></div>' +
      '</div>' +
      '<label class="inline-flex items-center gap-2 min-h-11 cursor-pointer">' +
      '<input type="checkbox" id="ayar_' + k + '_kalin" class="ayar-input w-5 h-5 rounded text-blue-600 focus:ring-blue-500">' +
      '<span class="text-sm text-gray-800 dark:text-gray-200">Kalın</span></label>' +
      '</fieldset>';
  });
  document.getElementById('yaziAyarlariKapsayici').innerHTML = html;
}

function ayarPaneliDoldur() {
  document.querySelectorAll('.ayar-input').forEach(function(el) {
    var anahtar = el.id.replace('ayar_', '');
    if (ayarlar[anahtar] === undefined) return;
    if (el.type === 'checkbox') el.checked = !!ayarlar[anahtar];
    else el.value = ayarlar[anahtar];
  });
}

function ayarDegisti(el) {
  var anahtar = el.id.replace('ayar_', '');
  if (el.type === 'checkbox') ayarlar[anahtar] = el.checked;
  else if (el.type === 'number') {
    if (el.value === '' || isNaN(Number(el.value))) return;
    ayarlar[anahtar] = Number(el.value);
  } else ayarlar[anahtar] = el.value;
  if (aktifAdim === 3) onizlemeyiGuncelle();
}

function ayarlariKaydet() {
  var btn = document.getElementById('kaydetBtn');
  butonMesgul(btn, true, 'Kaydediliyor...');
  showLoading('Ayarlar kaydediliyor');
  return jsonIste('/api/etiket-ekrani/ayarlar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ayarlar),
  })
    .then(function() { bildirimGoster('basarili', 'Kaydedildi', 'Etiket ayarları kaydedildi.'); })
    .catch(function(e) { bildirimGoster('hata', 'Ayarlar kaydedilemedi', e.message); })
    .finally(function() { hideLoading(); butonMesgul(btn, false); });
}

function ayarlariSifirla() {
  ayarlar = Object.assign({}, VARSAYILAN_AYARLAR);
  ayarPaneliDoldur();
  onizlemeyiGuncelle();
  ayarlariKaydet();
}

/* ── Yazdirma ── */

function yazdir() {
  var liste = seciliUrunler();
  if (liste.length === 0) {
    bildirimGoster('hata', 'Ürün yok', 'Yazdırmak için ürün seçin.');
    return;
  }
  var btn = document.getElementById('yazdirBtn');
  butonMesgul(btn, true, 'Hazırlanıyor...');

  var alan = document.getElementById('yazdirAlani');
  alan.innerHTML = '';
  liste.forEach(function(u) {
    var etiket = etiketOlustur(u, 1);
    etiket.style.pageBreakAfter = 'always';
    etiket.style.margin = '0';
    alan.appendChild(etiket);
  });

  var stil = document.createElement('style');
  stil.id = 'yazdir-stili';
  stil.textContent = '@media print { @page { size: ' + ayarlar.etiket_genislik + 'mm ' + ayarlar.etiket_yukseklik + 'mm; margin: ' + ayarlar.dis_bosluk + 'mm; } ' +
    'body { margin: 0; padding: 0; background: #fff; } header, nav, .no-print { display: none !important; } main { padding: 0 !important; margin: 0 !important; } ' +
    '#adim3 { display: block !important; } #yazdirAlani { display: block !important; } }';
  document.head.appendChild(stil);
  alan.classList.remove('hidden');

  setTimeout(function() {
    window.print();
    alan.classList.add('hidden');
    alan.innerHTML = '';
    stil.remove();
    butonMesgul(btn, false);
  }, 200);
}

function basimGonder() {
  var liste = seciliUrunler();
  if (liste.length === 0) {
    bildirimGoster('hata', 'Ürün yok', 'Göndermek için ürün seçin.');
    return;
  }
  var btn = document.getElementById('basimBtn');
  butonMesgul(btn, true, 'Gönderiliyor...');
  showLoading('Etiketler yazıcıya gönderiliyor');

  var etiketler = liste.map(function(u) {
    return {
      id: u.id,
      ad: u.ad,
      fiyat: fiyatBicimle(fiyatlar[u.id]),
      birim: birimler[u.id] || '',
      fiyat_tarihi: etiketTarihi(u),
    };
  });

  jsonIste('/api/etiket-ekrani/bas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etiketler: etiketler }),
  })
    .then(function(veri) { bildirimGoster('basarili', 'Gönderildi', veri.mesaj); })
    .catch(function(e) { bildirimGoster('hata', 'Gönderilemedi', e.message); })
    .finally(function() { hideLoading(); butonMesgul(btn, false); });
}

/* ── Olay Dinleyiciler ── */

document.addEventListener('DOMContentLoaded', function() {
  adimGostergesiniGuncelle();
  ayarPaneliniOlustur();
  ayarPaneliDoldur();
  urunleriYukle();
  ayarlariYukle();

  document.getElementById('aramaInput').addEventListener('input', urunListesiOlustur);

  document.getElementById('tumunuSecKutu').addEventListener('change', function() {
    var secilsin = this.checked;
    filtreliUrunler().forEach(function(u) {
      if (secilsin) seciliIdler.add(u.id); else seciliIdler.delete(u.id);
    });
    urunListesiOlustur();
  });

  document.addEventListener('change', function(e) {
    var el = e.target;
    if (el.classList.contains('urun-checkbox')) {
      var id = el.getAttribute('data-urun-id');
      if (el.checked) seciliIdler.add(id); else seciliIdler.delete(id);
      urunListesiOlustur();
    } else if (el.classList.contains('ayar-input')) {
      ayarDegisti(el);
    } else if (el.classList.contains('fiyat-input') && fiyatSayi(el.value) > 0) {
      el.value = fiyatBicimle(el.value);
      fiyatlar[el.getAttribute('data-fiyat-id')] = el.value;
      fiyatIpucuGuncelle(el.closest('[data-satir]'));
    }
  });

  document.addEventListener('input', function(e) {
    var el = e.target;
    if (el.classList.contains('fiyat-input')) {
      fiyatlar[el.getAttribute('data-fiyat-id')] = el.value;
      fiyatIpucuGuncelle(el.closest('[data-satir]'));
      fiyatDurumunuKontrolEt();
    } else if (el.classList.contains('birim-input')) {
      birimler[el.getAttribute('data-birim-id')] = el.value;
      fiyatIpucuGuncelle(el.closest('[data-satir]'));
    } else if (el.classList.contains('ayar-input') && el.type === 'number') {
      ayarDegisti(el);
    }
  });

  document.addEventListener('click', function(e) {
    var geri = e.target.closest('.fiyat-geri');
    if (!geri) return;
    var satir = geri.closest('[data-satir]');
    var urun = urunBul(satir.getAttribute('data-satir'));
    var fiyatInput = satir.querySelector('.fiyat-input');
    var birimInput = satir.querySelector('.birim-input');
    fiyatInput.value = fiyatBicimle(urun.fiyat);
    birimInput.value = urun.birim || '';
    fiyatlar[urun.id] = fiyatInput.value;
    birimler[urun.id] = birimInput.value;
    fiyatIpucuGuncelle(satir);
    fiyatDurumunuKontrolEt();
    fiyatInput.focus();
  });
});
