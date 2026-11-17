# Ürün Etiket Ekranı

Ürün fiyat etiketi oluşturup bastırmaya yarayan Flask modülü.

Akış: Ürün seç → Fiyatı kontrol et / gir → Etiket önizle, yazı ayarlarını yap, yazdır

- Ürünün sistemde fiyatı ve birimi varsa kutular dolu gelir, istenirse değiştirilir ("Sisteme dön" ile geri alınır). Birim listeden seçilir ya da elle yazılır (TL/kg, TL/250g, TL/Paket...).
- Etikete basılan tarih: fiyat sistemdekiyle aynıysa sistemdeki fiyat değişiklik tarihi, fiyat değiştirildiyse ya da sistemde fiyat yoksa bugünün tarihi.
- Fiyatı olmayan ürünlerde fiyat elle girilir; tüm fiyatlar girilmeden önizlemeye geçilmez.
- Önizleme ekranında etiket boyutu, boşluklar ve her alan için yazı tipi / boyut / kalınlık ayarlanır, önizleme anında güncellenir.

### Ürün verisi biçimi

```json
{"id": "urun-001", "ad": "MOR İSOT ORTA ACI", "birim": "TL/kg", "uretim_yeri": "Türkiye", "fiyat": 650.0, "fiyat_tarihi": "2026-05-02"}
```

`fiyat` sayı ya da `null`, `fiyat_tarihi` `YYYY-AA-GG` ya da `null`. `sahte_veri.json` etiket tablosunun Sayfa1'inden üretildi.

## Kurulum

```bash
pip install flask httpx
python dev_run.py
```

Tarayıcıda: `http://localhost:5000/etiket-ekrani`

## Dosya Yapısı

```
services/etiket_ekrani_service.py   # İş mantığı ve SQL
routes_etiket_ekrani.py             # Flask Blueprint
templates/base.html                 # Geliştirme şablonu (üretimde ana sistem şablonu kullanılır)
templates/etiket_ekrani.html        # Etiket ekranı sayfası
static/etiket_ekrani.js            # İstemci tarafı JavaScript
tests/test_etiket_ekrani.py        # Testler
sahte_veri.json                    # Geliştirme için sahte ürün verisi
dev_run.py                         # Yerel geliştirme sunucusu
```

## API Uç Noktaları

| Yol | Metot | Açıklama |
|-----|-------|----------|
| `/etiket-ekrani` | GET | Ana sayfa |
| `/api/etiket-ekrani/urunler` | GET | Ürün listesi (JSON) |
| `/api/etiket-ekrani/ayarlar` | GET | Kayıtlı etiket ayarları |
| `/api/etiket-ekrani/ayarlar` | POST | Ayarları kaydet |
| `/api/etiket-ekrani/bas` | POST | Etiket basım komutu gönder |

### Basım İsteği Formatı

```json
{
  "etiketler": [
    {"id": "urun-001", "ad": "MOR İSOT ORTA ACI", "fiyat": "650,00", "birim": "TL/kg", "fiyat_tarihi": "02.05.2026"}
  ]
}
```

## Etiket İçeriği

Her etiket şunları gösterir:
- **Ürün adı** (üst, kalın, ortalı)
- **Fiyat** (orta, büyük) + **Birim** (fiyatın altı)
- **Üretim yeri** + **Tarih** (alt, küçük)

Varsayılan etiket boyutu: 38mm × 58mm

## Ana Sisteme Entegrasyon

### Blueprint Kaydı

```python
from routes_etiket_ekrani import bp
app.register_blueprint(bp)
```

### Bağlanacak Fonksiyonlar (stub)

| Fonksiyon | Dosya | Açıklama |
|-----------|-------|----------|
| `urunleri_getir()` | `services/etiket_ekrani_service.py` | Şu an `sahte_veri.json` okuyor. Gerçek ürün kaynağına bağlanacak. |
| `etiket_bas(urun_id, urun_adi, fiyat, birim, fiyat_tarihi)` | `services/etiket_ekrani_service.py` | Şu an log'a yazıyor. Gerçek yazıcı/basım sistemi bağlantısı yapılacak. |

### Veritabanı Tabloları

Modül kendi tablolarını oluşturur, mevcut tablolara dokunmaz:

- `etiket_ayarlari` — Kullanıcı bazlı etiket görünüm ayarları (JSON)
- `etiket_basim_log` — Basım geçmişi (ürün id, ad, fiyat, zaman)

### Kullanıcı

Şu an sabit `"test"`. Ana sistemdeki oturum/kullanıcı bilgisine bağlanacak.

## Testler

```bash
python -m pytest tests/ -v
```
