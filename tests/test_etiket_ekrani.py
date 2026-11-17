import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import services.etiket_ekrani_service as servis


class TestUrunler(unittest.TestCase):
    def test_sahte_veri_yuklenebilir(self):
        veri = servis.urunleri_getir()
        self.assertIsInstance(veri, list)
        self.assertGreater(len(veri), 0)

    def test_urun_yapisi(self):
        veri = servis.urunleri_getir()
        ilk = veri[0]
        self.assertIn("id", ilk)
        self.assertIn("ad", ilk)
        self.assertIn("birim", ilk)
        self.assertIn("uretim_yeri", ilk)

    def test_fiyat_alani_sayi_veya_bos(self):
        for urun in servis.urunleri_getir():
            self.assertIn("fiyat", urun)
            if urun["fiyat"] is not None:
                self.assertIsInstance(urun["fiyat"], (int, float))
                self.assertGreater(urun["fiyat"], 0)

    def test_fiyat_tarihi_iso_veya_bos(self):
        import datetime
        for urun in servis.urunleri_getir():
            if urun.get("fiyat_tarihi"):
                datetime.date.fromisoformat(urun["fiyat_tarihi"])

    def test_urun_id_benzersiz(self):
        veri = servis.urunleri_getir()
        idler = [u["id"] for u in veri]
        self.assertEqual(len(idler), len(set(idler)))


class TestAyarlar(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        servis.DB_YOLU = self.tmp.name
        servis.init_schema()

    def tearDown(self):
        os.unlink(self.tmp.name)

    def test_varsayilan_ayarlar(self):
        ayarlar = servis.ayarlari_getir("test")
        self.assertEqual(ayarlar["etiket_genislik"], 38)
        self.assertEqual(ayarlar["etiket_yukseklik"], 58)
        self.assertTrue(ayarlar["urun_adi_kalin"])
        self.assertEqual(ayarlar["urun_adi_yazi_tipi"], "Times New Roman")
        self.assertTrue(ayarlar["fiyat_kalin"])
        self.assertFalse(ayarlar["birim_kalin"])
        self.assertEqual(ayarlar["alt_metin_boyut"], 6)

    def test_kaydet_ve_oku(self):
        yeni = dict(servis.VARSAYILAN_AYARLAR)
        yeni["etiket_genislik"] = 80
        yeni["fiyat_boyut"] = 40
        servis.ayarlari_kaydet("test", yeni)

        okunan = servis.ayarlari_getir("test")
        self.assertEqual(okunan["etiket_genislik"], 80)
        self.assertEqual(okunan["fiyat_boyut"], 40)

    def test_upsert(self):
        servis.ayarlari_kaydet("test", {"etiket_genislik": 60})
        servis.ayarlari_kaydet("test", {"etiket_genislik": 90})
        okunan = servis.ayarlari_getir("test")
        self.assertEqual(okunan["etiket_genislik"], 90)


class TestEtiketBas(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        servis.DB_YOLU = self.tmp.name
        servis.init_schema()

    def tearDown(self):
        os.unlink(self.tmp.name)

    def test_basim_stub(self):
        sonuc = servis.etiket_bas("urun-001", "Beyaz Pecete 100lu", "24.90")
        self.assertTrue(sonuc["ok"])

    def test_init_schema_tekrar_calisabilir(self):
        servis.init_schema()
        servis.init_schema()

    def test_basim_birim_ve_tarih_kaydedilir(self):
        servis.etiket_bas("urun-033", "YESIL KARABIBER", "300,00", "TL/100g", "02.07.2026")
        baglanti = servis._db_baglan()
        try:
            satir = baglanti.execute("SELECT birim, fiyat_tarihi FROM etiket_basim_log").fetchone()
            self.assertEqual(satir["birim"], "TL/100g")
            self.assertEqual(satir["fiyat_tarihi"], "02.07.2026")
        finally:
            baglanti.close()

    def test_basim_log(self):
        servis.etiket_bas("urun-001", "Beyaz Pecete 100lu", "24.90")
        servis.etiket_bas("urun-002", "Renkli Pecete 50li", "18.50")
        baglanti = servis._db_baglan()
        try:
            sayac = baglanti.execute("SELECT COUNT(*) FROM etiket_basim_log").fetchone()[0]
            self.assertEqual(sayac, 2)
        finally:
            baglanti.close()


class TestFlaskRoutes(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        servis.DB_YOLU = self.tmp.name
        servis.init_schema()

        from flask import Flask
        from routes_etiket_ekrani import bp

        app = Flask(
            __name__,
            template_folder=os.path.join(os.path.dirname(__file__), "..", "templates"),
            static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
        )
        app.register_blueprint(bp)
        app.config["TESTING"] = True
        self.client = app.test_client()

    def tearDown(self):
        os.unlink(self.tmp.name)

    def test_sayfa_200(self):
        r = self.client.get("/etiket-ekrani")
        self.assertEqual(r.status_code, 200)

    def test_urunler_api(self):
        r = self.client.get("/api/etiket-ekrani/urunler")
        self.assertEqual(r.status_code, 200)
        veri = r.get_json()
        self.assertIsInstance(veri, list)
        self.assertGreater(len(veri), 0)

    def test_ayarlar_api(self):
        r = self.client.get("/api/etiket-ekrani/ayarlar")
        self.assertEqual(r.status_code, 200)
        veri = r.get_json()
        self.assertIn("etiket_genislik", veri)
        self.assertIn("urun_adi_kalin", veri)

    def test_ayarlar_kaydet_api(self):
        r = self.client.post(
            "/api/etiket-ekrani/ayarlar",
            json={"etiket_genislik": 100},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_bas_api(self):
        r = self.client.post(
            "/api/etiket-ekrani/bas",
            json={"etiketler": [{"id": "urun-001", "ad": "Beyaz Pecete", "fiyat": "24.90"}]},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_bas_api_bos(self):
        r = self.client.post(
            "/api/etiket-ekrani/bas",
            json={"etiketler": []},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 400)

    def test_bas_api_etiket_yok(self):
        r = self.client.post(
            "/api/etiket-ekrani/bas",
            json={},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 400)

    def test_bas_api_coklu(self):
        r = self.client.post(
            "/api/etiket-ekrani/bas",
            json={"etiketler": [
                {"id": "urun-001", "ad": "Beyaz Pecete", "fiyat": "24.90"},
                {"id": "urun-002", "ad": "Renkli Pecete", "fiyat": "18.50"},
            ]},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        veri = r.get_json()
        self.assertTrue(veri["ok"])
        self.assertEqual(len(veri["sonuclar"]), 2)


if __name__ == "__main__":
    unittest.main()
