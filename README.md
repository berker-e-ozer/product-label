# Ürün Etiket Ekranı

Ürün fiyat etiketi oluşturup bastırmaya yarayan Flask modülü.

Akış: Ürün seç → Fiyat gir → Etiket önizle & yazdır

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
    {"id": "urun-001", "ad": "Beyaz Peçete 100'lü", "fiyat": "24.90"}
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
| `etiket_bas(urun_id, urun_adi, fiyat)` | `services/etiket_ekrani_service.py` | Şu an log'a yazıyor. Gerçek yazıcı/basım sistemi bağlantısı yapılacak. |

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
