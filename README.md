# Etiket Ekranı

Sipariş verilerinden kargo/ürün etiketi oluşturup bastırmaya yarayan Flask modülü.

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
sahte_veri.json                    # Geliştirme için sahte sipariş verisi
dev_run.py                         # Yerel geliştirme sunucusu
```

## API Uç Noktaları

| Yol | Metot | Açıklama |
|-----|-------|----------|
| `/etiket-ekrani` | GET | Ana sayfa |
| `/api/etiket-ekrani/siparisler` | GET | Sipariş listesi (JSON) |
| `/api/etiket-ekrani/ayarlar` | GET | Kayıtlı etiket ayarları |
| `/api/etiket-ekrani/ayarlar` | POST | Ayarları kaydet |
| `/api/etiket-ekrani/bas` | POST | Etiket basım komutu gönder |

## Ana Sisteme Entegrasyon

### Blueprint Kaydı

```python
from routes_etiket_ekrani import bp
app.register_blueprint(bp)
```

### Bağlanacak Fonksiyonlar (stub)

| Fonksiyon | Dosya | Açıklama |
|-----------|-------|----------|
| `siparisleri_getir()` | `services/etiket_ekrani_service.py` | Şu an `sahte_veri.json` okuyor. Gerçek sipariş kaynağına bağlanacak. |
| `etiket_bas(anahtar)` | `services/etiket_ekrani_service.py` | Şu an log'a yazıyor. Gerçek yazıcı/basım sistemi bağlantısı yapılacak. |

### Veritabanı Tabloları

Modül kendi tablolarını oluşturur, mevcut tablolara dokunmaz:

- `etiket_ayarlari` — Kullanıcı bazlı etiket görünüm ayarları (JSON)
- `etiket_basim_log` — Basım geçmişi

### Kullanıcı

Şu an sabit `"test"`. Ana sistemdeki oturum/kullanıcı bilgisine bağlanacak.

## Testler

```bash
python -m pytest tests/ -v
```

veya:

```bash
python -m unittest tests.test_etiket_ekrani -v
```
