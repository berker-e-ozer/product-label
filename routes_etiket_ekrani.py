from flask import Blueprint, render_template, request, jsonify
from services.etiket_ekrani_service import (
    urunleri_getir,
    ayarlari_getir,
    ayarlari_kaydet,
    etiket_bas,
    VARSAYILAN_AYARLAR,
    YAZI_TIPLERI,
)

bp = Blueprint("etiket_ekrani", __name__)


@bp.route("/etiket-ekrani")
def sayfa():
    return render_template(
        "etiket_ekrani.html",
        yazi_tipleri=YAZI_TIPLERI,
        varsayilan_ayarlar=VARSAYILAN_AYARLAR,
    )


@bp.route("/api/etiket-ekrani/urunler")
def urunler():
    try:
        veri = urunleri_getir()
        return jsonify(veri)
    except Exception as e:
        return jsonify({"error": f"Ürünler yüklenirken hata oluştu: {e}"}), 500


@bp.route("/api/etiket-ekrani/ayarlar", methods=["GET"])
def ayarlar_oku():
    try:
        ayarlar = ayarlari_getir()
        return jsonify(ayarlar)
    except Exception as e:
        return jsonify({"error": f"Ayarlar okunurken hata oluştu: {e}"}), 500


@bp.route("/api/etiket-ekrani/ayarlar", methods=["POST"])
def ayarlar_yaz():
    try:
        gelen = request.get_json()
        if not gelen:
            return jsonify({"error": "Geçersiz istek gövdesi"}), 400
        ayarlari_kaydet(ayarlar=gelen)
        return jsonify({"ok": True, "mesaj": "Ayarlar kaydedildi"})
    except Exception as e:
        return jsonify({"error": f"Ayarlar kaydedilirken hata oluştu: {e}"}), 500


@bp.route("/api/etiket-ekrani/bas", methods=["POST"])
def bas():
    try:
        gelen = request.get_json()
        if not gelen or "etiketler" not in gelen:
            return jsonify({"error": "Basılacak etiket verisi belirtilmedi"}), 400

        etiketler = gelen["etiketler"]
        if not isinstance(etiketler, list) or len(etiketler) == 0:
            return jsonify({"error": "En az bir ürün seçmelisiniz"}), 400

        sonuclar = []
        for et in etiketler:
            sonuc = etiket_bas(
                et.get("id", ""),
                et.get("ad", ""),
                et.get("fiyat", ""),
                et.get("birim", ""),
                et.get("fiyat_tarihi", ""),
            )
            sonuclar.append(sonuc)

        return jsonify({
            "ok": True,
            "mesaj": f"{len(etiketler)} etiket basım komutu gönderildi",
            "sonuclar": sonuclar,
        })
    except Exception as e:
        return jsonify({"error": f"Etiket basılırken hata oluştu: {e}"}), 500
