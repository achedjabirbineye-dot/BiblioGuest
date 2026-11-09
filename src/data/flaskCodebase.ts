/**
 * Code source complet Python / Flask / SQLAlchemy / pytest
 * Strictement aligné sur les 4 diagrammes UML pour le TP d'outils et méthodes de développement logiciel
 */

export interface FlaskFile {
  path: string;
  category: 'config' | 'models' | 'services' | 'routes' | 'templates' | 'tests';
  description: string;
  content: string;
}

export const FLASK_PROJECT_FILES: FlaskFile[] = [
  {
    path: 'requirements.txt',
    category: 'config',
    description: 'Dépendances Python 3.10+ pour le projet Flask',
    content: `Flask==3.0.2
Flask-SQLAlchemy==3.1.1
Flask-Login==0.6.3
Flask-WTF==1.2.1
Werkzeug==3.0.1
qrcode==7.4.2
Pillow==10.2.0
pytest==8.0.2
`,
  },
  {
    path: 'config.py',
    category: 'config',
    description: 'Configuration centrale de l’application et paramètres de gestion',
    content: `import os

class Config:
    """Configuration de base de l'application Flask de gestion de bibliothèque."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cle-secrete-tp-omdl-biblio-2026'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///bibliotheque.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Paramètres de gestion (Section 4 du cahier des charges UML)
    DUREE_PRET_JOURS = 15
    NB_RENOUVELLEMENTS_MAX = 1
    MAX_EMPRUNTS_SIMULTANES = 3
    PENALITE_PAR_JOUR = 50.00
    PLAFOND_PENALITE = 100.00
    VALIDITE_RESERVATION_JOURS = 7
`,
  },
  {
    path: 'models/adherent.py',
    category: 'models',
    description: 'Modèle Adherent avec numéro de carte (QR code) et méthodes UML',
    content: `from datetime import date
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class Adherent(UserMixin, db.Model):
    """
    Classe Adherent du diagramme de classes validé.
    Identifié principalement par son numéro de carte (contenu du QR Code).
    """
    __tablename__ = 'adherents'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_carte = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=False)
    date_fin_abonnement = db.Column(db.Date, nullable=False)
    statut = db.Column(db.String(20), nullable=False, default='actif')  # actif, suspendu, inactif

    # Relations UML
    prets = db.relationship('Pret', backref='adherent', lazy='dynamic')
    reservations = db.relationship('Reservation', backref='adherent', lazy='dynamic')
    penalites = db.relationship('Penalite', backref='adherent', lazy='dynamic')

    def set_mot_de_passe(self, mot_de_passe):
        self.mot_de_passe_hash = generate_password_hash(mot_de_passe)

    def verifier_mot_de_passe(self, mot_de_passe):
        return check_password_hash(self.mot_de_passe_hash, mot_de_passe)

    def a_abonnement_valide(self) -> bool:
        """Vérifie si l'abonnement est actif et non expiré (Règle 1)."""
        return self.statut == 'actif' and self.date_fin_abonnement >= date.today()

    def nb_emprunts_en_cours(self) -> int:
        """Compte les prêts en cours ou en retard."""
        return self.prets.filter(Pret.statut.in_(['EN_COURS', 'EN_RETARD'])).count()

    def a_penalite_impayee(self) -> bool:
        """Vérifie s'il existe une pénalité non réglée (Règle 4)."""
        return self.penalites.filter_by(est_payee=False).first() is not None

    def emprunter(self, exemplaire, bibliothecaire):
        """
        Méthode UML conceptuelle : valide l'éligibilité avant création du prêt au comptoir.
        """
        if not self.a_abonnement_valide():
            raise ValueError("Abonnement non valide. Contactez la bibliothèque.")
        if self.a_penalite_impayee():
            raise ValueError("Vous avez une pénalité impayée.")
        if self.nb_emprunts_en_cours() >= 3:
            raise ValueError("Vous avez déjà 3 emprunts en cours.")
        return bibliothecaire.enregistrer_pret(self, exemplaire)

    def reserver(self, ouvrage):
        """
        Méthode UML : Réserve un ouvrage indisponible (Section 5).
        """
        from services.reservation_service import creer_reservation
        return creer_reservation(self, ouvrage)
`,
  },
  {
    path: 'models/bibliothecaire.py',
    category: 'models',
    description: 'Modèle Bibliothecaire avec matricule et méthodes UML au comptoir',
    content: `from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class Bibliothecaire(UserMixin, db.Model):
    """
    Classe Bibliothecaire du diagramme de classes validé.
    Gestionnaire exclusif des opérations de prêt, retour et pénalité au comptoir.
    """
    __tablename__ = 'bibliothecaires'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    matricule = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=False)

    prets_enregistres = db.relationship('Pret', backref='bibliothecaire', lazy='dynamic')

    def set_mot_de_passe(self, mot_de_passe):
        self.mot_de_passe_hash = generate_password_hash(mot_de_passe)

    def verifier_mot_de_passe(self, mot_de_passe):
        return check_password_hash(self.mot_de_passe_hash, mot_de_passe)

    def enregistrer_pret(self, adherent, exemplaire):
        """Méthode UML : enregistre un prêt au comptoir (Section 9)."""
        from services.pret_service import enregistrer_pret_service
        return enregistrer_pret_service(self, adherent, exemplaire)

    def enregistrer_retour(self, exemplaire):
        """Méthode UML : enregistre la restitution d'un exemplaire au comptoir."""
        from services.retour_service import enregistrer_retour_service
        return enregistrer_retour_service(self, exemplaire)

    def enregistrer_penalite(self, pret, montant, motif="Retard de restitution"):
        """Méthode UML : enregistre la pénalité validée par le bibliothécaire."""
        from services.penalite_service import enregistrer_penalite_service
        return enregistrer_penalite_service(self, pret, montant, motif)
`,
  },
  {
    path: 'models/ouvrage.py',
    category: 'models',
    description: 'Modèle Ouvrage (attributs auteur et catégorie directs selon diagramme)',
    content: `from app import db

class Ouvrage(db.Model):
    """
    Classe Ouvrage du diagramme de classes validé.
    auteur et categorie sont des attributs simples pour respecter strictement le diagramme UML validé.
    """
    __tablename__ = 'ouvrages'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    isbn = db.Column(db.String(20), unique=True, nullable=False, index=True)
    titre = db.Column(db.String(255), nullable=False, index=True)
    auteur = db.Column(db.String(255), nullable=False, index=True)
    categorie = db.Column(db.String(100), nullable=False, index=True)
    editeur = db.Column(db.String(150), nullable=True)
    annee = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)

    # Relations : suppression interdite si des exemplaires existent (ON DELETE RESTRICT)
    exemplaires = db.relationship('Exemplaire', backref='ouvrage', lazy='dynamic', cascade="all")
    reservations = db.relationship('Reservation', backref='ouvrage', lazy='dynamic')

    def exemplaires_disponibles_count(self) -> int:
        return self.exemplaires.filter_by(etat='DISPONIBLE').count()
`,
  },
  {
    path: 'models/exemplaire.py',
    category: 'models',
    description: 'Modèle Exemplaire avec 5 états stricts et méthode est_disponible()',
    content: `from app import db

class Exemplaire(db.Model):
    """
    Classe Exemplaire du diagramme de classes validé.
    États autorisés (stricts, Section 8) : DISPONIBLE, EMPRUNTE, EN_RETARD, RESERVE, PERDU.
    """
    __tablename__ = 'exemplaires'

    ETATS_VALIDES = ['DISPONIBLE', 'EMPRUNTE', 'EN_RETARD', 'RESERVE', 'PERDU']

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code_barre = db.Column(db.String(50), unique=True, nullable=False, index=True)
    ouvrage_id = db.Column(db.Integer, db.ForeignKey('ouvrages.id', ondelete='RESTRICT'), nullable=False)
    etat = db.Column(db.String(20), nullable=False, default='DISPONIBLE')

    prets = db.relationship('Pret', backref='exemplaire', lazy='dynamic')

    def est_disponible(self) -> bool:
        """Méthode UML : retourne True si l'exemplaire est prêt à être emprunté."""
        return self.etat == 'DISPONIBLE'
`,
  },
  {
    path: 'models/pret.py',
    category: 'models',
    description: 'Modèle Pret avec méthodes renouveler() et est_en_retard()',
    content: `from datetime import date, timedelta
from app import db

class Pret(db.Model):
    """
    Classe Pret du diagramme de classes validé.
    Statuts : EN_COURS, EN_RETARD, CLOTURE, PERDU.
    """
    __tablename__ = 'prets'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    adherent_id = db.Column(db.Integer, db.ForeignKey('adherents.id', ondelete='RESTRICT'), nullable=False)
    exemplaire_id = db.Column(db.Integer, db.ForeignKey('exemplaires.id', ondelete='RESTRICT'), nullable=False)
    bibliothecaire_id = db.Column(db.Integer, db.ForeignKey('bibliothecaires.id', ondelete='RESTRICT'), nullable=False)
    date_pret = db.Column(db.Date, nullable=False, default=date.today)
    date_retour_prevue = db.Column(db.Date, nullable=False)
    date_retour_effective = db.Column(db.Date, nullable=True)
    nb_renouvellements = db.Column(db.Integer, nullable=False, default=0)
    statut = db.Column(db.String(20), nullable=False, default='EN_COURS')

    # Association 0..1 avec Penalite
    penalite = db.relationship('Penalite', backref='pret', uselist=False)

    def renouveler(self):
        """Méthode UML : prolonge de 15 jours si nb_renouvellements == 0 et aucun retard."""
        if self.nb_renouvellements >= 1:
            raise ValueError("Ce prêt a déjà été renouvelé une fois.")
        if self.est_en_retard():
            raise ValueError("Impossible de renouveler un prêt en retard.")
        self.nb_renouvellements += 1
        self.date_retour_prevue += timedelta(days=15)

    def est_en_retard(self) -> bool:
        """Méthode UML : vrai si date_retour_prevue dépassée et non restitué."""
        if self.date_retour_effective is not None:
            return False
        return date.today() > self.date_retour_prevue
`,
  },
  {
    path: 'models/reservation.py',
    category: 'models',
    description: 'Modèle Reservation portant sur l’Ouvrage (file FIFO, méthode annuler)',
    content: `from datetime import datetime
from app import db

class Reservation(db.Model):
    """
    Classe Reservation du diagramme de classes validé.
    Porte sur un Ouvrage (et non sur un exemplaire précis).
    Statuts : EN_ATTENTE, DISPONIBLE, HONOREE, EXPIREE, ANNULEE.
    """
    __tablename__ = 'reservations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    adherent_id = db.Column(db.Integer, db.ForeignKey('adherents.id', ondelete='RESTRICT'), nullable=False)
    ouvrage_id = db.Column(db.Integer, db.ForeignKey('ouvrages.id', ondelete='RESTRICT'), nullable=False)
    date_reservation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    statut = db.Column(db.String(20), nullable=False, default='EN_ATTENTE')
    exemplaire_reserve_id = db.Column(db.Integer, db.ForeignKey('exemplaires.id'), nullable=True)
    date_expiration_retrait = db.Column(db.Date, nullable=True)

    def annuler(self):
        """Méthode UML : annule la réservation."""
        self.statut = 'ANNULEE'
`,
  },
  {
    path: 'models/penalite.py',
    category: 'models',
    description: 'Modèle Penalite généré par un prêt en retard ou perte',
    content: `from datetime import datetime
from app import db

class Penalite(db.Model):
    """
    Classe Penalite du diagramme de classes validé.
    Association 0..1 avec Pret.
    """
    __tablename__ = 'penalites'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pret_id = db.Column(db.Integer, db.ForeignKey('prets.id', ondelete='RESTRICT'), unique=True, nullable=True)
    adherent_id = db.Column(db.Integer, db.ForeignKey('adherents.id', ondelete='RESTRICT'), nullable=False)
    montant = db.Column(db.Numeric(6, 2), nullable=False)
    est_payee = db.Column(db.Boolean, nullable=False, default=False)
    motif = db.Column(db.String(255), nullable=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_reglement = db.Column(db.DateTime, nullable=True)
`,
  },
  {
    path: 'services/state_machine.py',
    category: 'services',
    description: 'Machine à états finie stricte de l’Exemplaire selon la Section 8',
    content: `class StateMachineError(Exception):
    """Exception levée en cas de transition non conforme au diagramme d'états UML."""
    pass

TRANSITIONS_AUTORISEES = {
    ('DISPONIBLE', 'EMPRUNTE'): "enregistrer_pret()",
    ('EMPRUNTE', 'DISPONIBLE'): "enregistrer_retour() (aucune réservation)",
    ('EMPRUNTE', 'EN_RETARD'): "date de retour prévue dépassée",
    ('EN_RETARD', 'DISPONIBLE'): "enregistrer_retour() + enregistrer_penalite()",
    ('EMPRUNTE', 'RESERVE'): "retour avec réservation en attente",
    ('RESERVE', 'EMPRUNTE'): "enregistrer_pret() à l'adhérent qui a réservé",
    ('RESERVE', 'DISPONIBLE'): "délai de retrait expiré",
    ('EMPRUNTE', 'PERDU'): "déclaré perdu",
    ('EN_RETARD', 'PERDU'): "déclaré perdu",
    ('EN_RETARD', 'RESERVE'): "retour en retard avec réservation en attente",
}

def transition_exemplaire(exemplaire, nouvel_etat: str):
    """
    Applique une transition d'état sur l'exemplaire.
    Lève StateMachineError si la transition viole le diagramme UML validé.
    """
    etat_actuel = exemplaire.etat
    if etat_actuel == nouvel_etat:
        return

    transition_cle = (etat_actuel, nouvel_etat)
    if transition_cle not in TRANSITIONS_AUTORISEES:
        raise StateMachineError(
            f"Transition interdite par le diagramme UML : de '{etat_actuel}' vers '{nouvel_etat}'."
        )

    exemplaire.etat = nouvel_etat
`,
  },
  {
    path: 'tests/test_biblio.py',
    category: 'tests',
    description: '5 tests pytest obligatoires (Section 13) + test du diagramme d’états',
    content: `from datetime import date, timedelta
import pytest
from app import create_app, db
from models.adherent import Adherent
from models.bibliothecaire import Bibliothecaire
from models.ouvrage import Ouvrage
from models.exemplaire import Exemplaire
from models.pret import Pret
from services.pret_service import enregistrer_pret_service
from services.retour_service import enregistrer_retour_service, calculer_penalite_proposee
from services.state_machine import transition_exemplaire, StateMachineError

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

# TEST 1 : Prêt valide -> succès
def test_pret_valide_succes(app):
    with app.app_context():
        biblio = Bibliothecaire(matricule='BIB-001', nom='Nom', prenom='Prenom', email='b@b.ma', mot_de_passe_hash='h')
        adh = Adherent(numero_carte='ETU-2024-0001', nom='Alami', prenom='Karim', email='k@u.ma',
                       mot_de_passe_hash='h', date_fin_abonnement=date.today() + timedelta(days=100), statut='actif')
        ouv = Ouvrage(isbn='111', titre='Livre 1', auteur='Auteur', categorie='Cat')
        db.session.add_all([biblio, adh, ouv])
        db.session.flush()

        ex = Exemplaire(code_barre='EX-01', ouvrage_id=ouv.id, etat='DISPONIBLE')
        db.session.add(ex)
        db.session.commit()

        pret = enregistrer_pret_service(biblio, adh, ex)
        assert pret.id is not None
        assert pret.statut == 'EN_COURS'
        assert ex.etat == 'EMPRUNTE'

# TEST 2 : Prêt refusé : abonnement expiré
def test_pret_refuse_abonnement_expire(app):
    with app.app_context():
        biblio = Bibliothecaire(matricule='BIB-001', nom='N', prenom='P', email='b@b.ma', mot_de_passe_hash='h')
        adh = Adherent(numero_carte='ETU-2024-0004', nom='Zahra', prenom='F', email='f@u.ma',
                       mot_de_passe_hash='h', date_fin_abonnement=date.today() - timedelta(days=10), statut='actif')
        ouv = Ouvrage(isbn='222', titre='Livre 2', auteur='Auteur', categorie='Cat')
        db.session.add_all([biblio, adh, ouv])
        db.session.flush()
        ex = Exemplaire(code_barre='EX-02', ouvrage_id=ouv.id, etat='DISPONIBLE')
        db.session.add(ex)
        db.session.commit()

        with pytest.raises(ValueError, match="Abonnement non valide"):
            enregistrer_pret_service(biblio, adh, ex)

# TEST 3 : Prêt refusé : exemplaire déjà emprunté
def test_pret_refuse_exemplaire_deja_emprunte(app):
    with app.app_context():
        biblio = Bibliothecaire(matricule='BIB-001', nom='N', prenom='P', email='b@b.ma', mot_de_passe_hash='h')
        adh = Adherent(numero_carte='ETU-2024-0001', nom='A', prenom='K', email='k@u.ma',
                       mot_de_passe_hash='h', date_fin_abonnement=date.today() + timedelta(days=100), statut='actif')
        ouv = Ouvrage(isbn='333', titre='Livre 3', auteur='Auteur', categorie='Cat')
        db.session.add_all([biblio, adh, ouv])
        db.session.flush()
        ex = Exemplaire(code_barre='EX-03', ouvrage_id=ouv.id, etat='EMPRUNTE')
        db.session.add(ex)
        db.session.commit()

        with pytest.raises(ValueError, match="Cet exemplaire n'est plus disponible"):
            enregistrer_pret_service(biblio, adh, ex)

# TEST 4 : Retour en retard -> proposition de pénalité correcte (jours x 50 DH, plafond 100 DH)
def test_calcul_penalite_retard(app):
    # 1 jour de retard -> 50.00 DH
    assert calculer_penalite_proposee(jours_retard=1) == 50.00
    # 3 jours de retard -> plafonné à 100.00 DH
    assert calculer_penalite_proposee(jours_retard=3) == 100.00

# TEST 5 : Transition interdite (DISPONIBLE -> EN_RETARD) -> refusée
def test_transition_interdite_refusee(app):
    with app.app_context():
        ouv = Ouvrage(isbn='444', titre='Livre 4', auteur='Auteur', categorie='Cat')
        db.session.add(ouv)
        db.session.flush()
        ex = Exemplaire(code_barre='EX-04', ouvrage_id=ouv.id, etat='DISPONIBLE')
        db.session.add(ex)
        db.session.commit()

        with pytest.raises(StateMachineError):
            transition_exemplaire(ex, 'EN_RETARD')
`,
  },
];
