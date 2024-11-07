from flask import Flask

app = Flask(__name__)

# Konfiguration
app.config['SECRET_KEY'] = 'NacionalCampeonMundial'  # Byt ut mot en säker nyckel

@app.route('/')
def home():
    return "Bienvenido a O'Higgins y Las Huertas"

if __name__ == '__main__':
    app.run(debug=True)
