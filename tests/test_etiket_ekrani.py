import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import services.etiket_ekrani_service as servis


class TestSiparisler(unittest.TestCase):
    def test_sahte_veri_yuklenebilir(self):
        veri = servis.siparisleri_getir()
        self.assertIsInstance(veri, list)
        self.assertGreater(len(veri), 0)

    def test_siparis_yapisi(self):
        veri = servis.siparisleri_getir()
        ilk = veri[0]
        self.assertIn("anahtar", ilk)
        self.assertIn("no", ilk)
        self.assertIn("musteri", ilk)
        self.assertIn("tarih", ilk)
        self.assertIn("kargo", ilk)
        self.assertIn("firma", ilk["kargo"])
        self.assertIn("il", ilk["kargo"])
        self.assertIn("ilce", ilk["kargo"])


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
        self.assertEqual(ayarlar["etiket_genislik"], 50)
        self.assertEqual(ayarlar["etiket_yukseklik"], 70)
        self.assertTrue(ayarlar["siparis_no_kalin"])

    def test_kaydet_ve_oku(self):
        yeni = dict(servis.VARSAYILAN_AYARLAR)
        yeni["etiket_genislik"] = 80
        yeni["kargo_boyut"] = 24
        servis.ayarlari_kaydet("test", yeni)

        okunan = servis.ayarlari_getir("test")
        self.assertEqual(okunan["etiket_genislik"], 80)
        self.assertEqual(okunan["kargo_boyut"], 24)

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
        sonuc = servis.etiket_bas("shopify:1001")
        self.assertTrue(sonuc["ok"])

    def test_basim_log(self):
        servis.etiket_bas("shopify:1001")
        servis.etiket_bas("shopify:1002")
        log = servis.basim_logunu_getir()
        self.assertEqual(len(log), 2)


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

    def test_siparisler_api(self):
        r = self.client.get("/api/etiket-ekrani/siparisler")
        self.assertEqual(r.status_code, 200)
        veri = r.get_json()
        self.assertIsInstance(veri, list)

    def test_ayarlar_api(self):
        r = self.client.get("/api/etiket-ekrani/ayarlar")
        self.assertEqual(r.status_code, 200)
        veri = r.get_json()
        self.assertIn("etiket_genislik", veri)

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
            json={"anahtarlar": ["shopify:1001"]},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_bas_api_bos(self):
        r = self.client.post(
            "/api/etiket-ekrani/bas",
            json={"anahtarlar": []},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 400)


if __name__ == "__main__":
    unittest.main()
