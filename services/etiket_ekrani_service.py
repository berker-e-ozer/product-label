import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path

DB_YOLU = os.environ.get("ETIKET_DB_YOLU", "etiket_ekrani.db")

VARSAYILAN_AYARLAR = {
    "siparis_no_yazi_tipi": "Arial",
    "siparis_no_boyut": 12,
    "siparis_no_kalin": True,
    "musteri_yazi_tipi": "Arial",
    "musteri_boyut": 14,
    "musteri_kalin": True,
    "kargo_yazi_tipi": "Arial",
    "kargo_boyut": 18,
    "kargo_kalin": True,
    "adres_yazi_tipi": "Arial",
    "adres_boyut": 11,
    "adres_kalin": False,
    "tarih_yazi_tipi": "Arial",
    "tarih_boyut": 9,
    "tarih_kalin": False,
    "etiket_genislik": 50,
    "etiket_yukseklik": 70,
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
                siparis_anahtar TEXT NOT NULL,
                kullanici TEXT NOT NULL DEFAULT 'test',
                durum TEXT NOT NULL DEFAULT 'gonderildi',
                zaman TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
        """)
        baglanti.commit()
    finally:
        baglanti.close()


def siparisleri_getir():
    """Siparis listesini dondurur.
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
            birlesik = {**VARSAYILAN_AYARLAR, **kaydedilen}
            return birlesik
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


def etiket_bas(anahtar):
    """Yaziciya etiket basim komutu gonderir.
    Simdilik stub; Alp gercek yazici baglantisini yapacak.
    """
    baglanti = _db_baglan()
    try:
        baglanti.execute(
            """
            INSERT INTO etiket_basim_log (siparis_anahtar, kullanici, durum, zaman)
            VALUES (?, 'test', 'gonderildi', datetime('now', 'localtime'))
            """,
            (anahtar,),
        )
        baglanti.commit()
    finally:
        baglanti.close()
    return {"ok": True, "mesaj": f"{anahtar} icin etiket basim komutu gonderildi"}


def basim_logunu_getir(limit=50):
    baglanti = _db_baglan()
    try:
        satirlar = baglanti.execute(
            "SELECT * FROM etiket_basim_log ORDER BY zaman DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(s) for s in satirlar]
    finally:
        baglanti.close()
