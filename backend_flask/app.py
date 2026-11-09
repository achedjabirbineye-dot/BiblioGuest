"""
Factory de l'application Flask
Initialisation de l'ORM SQLAlchemy, Flask-Login, et enregistrement des 4 Blueprints MVC.
"""

from flask import Flask, redirect, url_for
from flask_login import LoginManager
from config import Config
from models import db
from models.adherent import Adherent
from models.bibliothecaire import Bibliothecaire

login_manager = LoginManager()
login_manager.login_view = 'auth.login_bibliothecaire'
login_manager.login_message = "Veuillez vous connecter pour accéder à cette page."
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
    # Gestion du double rôle dans la session (Bibliothécaire ou Adhérent)
    if user_id.startswith('bib_'):
        real_id = int(user_id.replace('bib_', ''))
        return Bibliothecaire.query.get(real_id)
    elif user_id.startswith('adh_'):
        real_id = int(user_id.replace('adh_', ''))
        return Adherent.query.get(real_id)
    # Repli
    return Bibliothecaire.query.get(int(user_id)) or Adherent.query.get(int(user_id))

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialisation des extensions
    db.init_app(app)
    login_manager.init_app(app)

    # Enregistrement des 4 Blueprints MVC
    from routes.auth import auth_bp
    from routes.bibliothecaire import biblio_bp
    from routes.adherent import adherent_bp
    from routes.catalogue import catalogue_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(biblio_bp)
    app.register_blueprint(adherent_bp)
    app.register_blueprint(catalogue_bp)

    @app.route('/')
    def index():
        return redirect(url_for('catalogue.index'))

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
