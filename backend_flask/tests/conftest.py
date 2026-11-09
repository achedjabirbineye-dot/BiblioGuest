"""
Fixtures pytest pour la suite de tests de gestion de bibliothèque
Initialisation d'une base de données SQLite en mémoire isolée pour chaque test.
"""

from datetime import date, timedelta
import pytest
from app import create_app
from models.adherent import db, Adherent
from models.bibliothecaire import Bibliothecaire
from models.ouvrage import Ouvrage
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.reservation import Reservation
from models.penalite import Penalite

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test-secret-key'
    WTF_CSRF_ENABLED = False
    DUREE_PRET_JOURS = 15
    NB_RENOUVELLEMENTS_MAX = 1
    MAX_EMPRUNTS_SIMULTANES = 3
    PENALITE_PAR_JOUR = 50.00
    PLAFOND_PENALITE = 100.00
    VALIDITE_RESERVATION_JOURS = 7

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def donnees_base(app):
    """Jeu de données de base minimal pour les tests."""
    with app.app_context():
        biblio = Bibliothecaire(
            matricule='BIB-001',
            nom='Mansouri',
            prenom='Driss',
            email='admin@biblio.ma'
        )
        biblio.set_mot_de_passe('admin123')

        adherent_valide = Adherent(
            numero_carte='ETU-2025-0001',
            nom='Alami',
            prenom='Karim',
            email='karim.alami@univ.ma',
            date_fin_abonnement=date.today() + timedelta(days=90),
            statut='actif'
        )
        adherent_valide.set_mot_de_passe('secret123')

        adherent_expire = Adherent(
            numero_carte='ETU-2025-0004',
            nom='Zahra',
            prenom='Fatima',
            email='fatima.zahra@univ.ma',
            date_fin_abonnement=date.today() - timedelta(days=30), # Expiré
            statut='actif'
        )
        adherent_expire.set_mot_de_passe('secret123')

        ouvrage = Ouvrage(
            isbn='978-2070612758',
            titre='Le Petit Prince',
            auteur='Antoine de Saint-Exupéry',
            categorie='Roman',
            annee=1943
        )

        db.session.add_all([biblio, adherent_valide, adherent_expire, ouvrage])
        db.session.flush()

        ex1 = Exemplaire(code_barre='EX-0001-01', ouvrage_id=ouvrage.id, etat='DISPONIBLE')
        ex2 = Exemplaire(code_barre='EX-0001-02', ouvrage_id=ouvrage.id, etat='DISPONIBLE')
        db.session.add_all([ex1, ex2])
        db.session.commit()

        return {
            'biblio': biblio,
            'adherent_valide': adherent_valide,
            'adherent_expire': adherent_expire,
            'ouvrage': ouvrage,
            'ex1': ex1,
            'ex2': ex2
        }
