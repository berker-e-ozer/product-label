import json
import os
import sqlite3
from pathlib import Path

DB_YOLU = os.environ.get("ETIKET_DB_YOLU", "etiket_ekrani.db")

VARSAYILAN_AYARLAR = {
    "urun_adi_yazi_tipi": "Arial",
    "urun_adi_boyut": 16,
    "urun_adi_kalin": True,
    "fiyat_yazi_tipi": "Arial",
    "fiyat_boyut": 32,
    "fiyat_kalin": False,
    "birim_yazi_tipi": "Arial",
    "birim_boyut": 24,
    "birim_kalin": False,
    "alt_metin_yazi_tipi": "Arial",
    "alt_metin_boyut": 10,
    "alt_metin_kalin": False,
    "etiket_genislik": 38,
    "etiket_yukseklik": 58,
    "ic_bosluk": 2,
    "dis_bosluk": 0,
}

YAZI_TIPLERI = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Courier New",
    "Trebuchet MS",
    "Tahoma",
]


def _db_baglan():
    baglanti = sqlite3.connect(DB_YOLU)
    baglanti.row_factory = sqlite3.Row
    return baglanti


def init_schema():
    baglanti = _db_baglan()
    try:
        baglanti.execute("""
            CREATE TABLE IF NOT EXISTS etiket_ayarlari (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kullanici TEXT NOT NULL DEFAULT 'test',
                ayarlar TEXT NOT NULL,
                zaman TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                UNIQUE(kullanici)
            )
        """)
        baglanti.execute("""
            CREATE TABLE IF NOT EXISTS etiket_basim_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                urun_id TEXT NOT NULL,
                urun_adi TEXT NOT NULL,
                fiyat TEXT NOT NULL,
                kullanici TEXT NOT NULL DEFAULT 'test',
                durum TEXT NOT NULL DEFAULT 'gonderildi',
                zaman TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
        """)
        baglanti.commit()
    finally:
        baglanti.close()


def urunleri_getir():
    """Urun listesini dondurur.
    Gelistirmede sahte_veri.json'dan okur.
    Alp gercek sisteme baglarken bu fonksiyonu degistirecek.
    """
    veri_yolu = Path(__file__).resolve().parent.parent / "sahte_veri.json"
    with open(veri_yolu, "r", encoding="utf-8") as f:
        return json.load(f)


def ayarlari_getir(kullanici="test"):
    baglanti = _db_baglan()
    try:
        satir = baglanti.execute(
            "SELECT ayarlar FROM etiket_ayarlari WHERE kullanici = ?",
            (kullanici,),
        ).fetchone()
        if satir:
            kaydedilen = json.loads(satir["ayarlar"])
            return {**VARSAYILAN_AYARLAR, **kaydedilen}
        return dict(VARSAYILAN_AYARLAR)
    finally:
        baglanti.close()


def ayarlari_kaydet(kullanici="test", ayarlar=None):
    if ayarlar is None:
        return
    baglanti = _db_baglan()
    try:
        baglanti.execute(
            """
            INSERT INTO etiket_ayarlari (kullanici, ayarlar, zaman)
            VALUES (?, ?, datetime('now', 'localtime'))
            ON CONFLICT(kullanici) DO UPDATE SET
                ayarlar = excluded.ayarlar,
                zaman = excluded.zaman
            """,
            (kullanici, json.dumps(ayarlar, ensure_ascii=False)),
        )
        baglanti.commit()
    finally:
        baglanti.close()


def etiket_bas(urun_id, urun_adi, fiyat):
    """Yaziciya etiket basim komutu gonderir.
    Simdilik log'a yazar; Alp gercek yazici baglantisini yapacak.
    """
    baglanti = _db_baglan()
    try:
        baglanti.execute(
            """
            INSERT INTO etiket_basim_log (urun_id, urun_adi, fiyat, kullanici, durum, zaman)
            VALUES (?, ?, ?, 'test', 'gonderildi', datetime('now', 'localtime'))
            """,
            (urun_id, urun_adi, fiyat),
        )
        baglanti.commit()
    finally:
        baglanti.close()
    return {"ok": True, "mesaj": f"{urun_adi} icin etiket basim komutu gonderildi"}
