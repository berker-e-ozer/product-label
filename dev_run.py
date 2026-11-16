"""Yerel gelistirme sunucusu.
Ana sisteme alindiginda bu dosya kullanilmaz;
Blueprint routes_etiket_ekrani.bp olarak import edilir.
"""

from flask import Flask
from routes_etiket_ekrani import bp
from services.etiket_ekrani_service import init_schema

app = Flask(__name__)
app.register_blueprint(bp)

init_schema()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
