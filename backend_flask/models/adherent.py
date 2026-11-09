from datetime import date
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Référence partagée
db = SQLAlchemy()

class Adherent(db.Model):
    __tablename__ = 'adherents'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_carte = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=False)
    date_fin_abonnement = db.Column(db.Date, nullable=False)
    statut = db.Column(db.String(20), nullable=False, default='actif')

    prets = db.relationship('Pret', backref='adherent', lazy='dynamic')
    reservations = db.relationship('Reservation', backref='adherent', lazy='dynamic')
    penalites = db.relationship('Penalite', backref='adherent', lazy='dynamic')

    def set_mot_de_passe(self, mdp):
        self.mot_de_passe_hash = generate_password_hash(mdp)

    def verifier_mot_de_passe(self, mdp):
        return check_password_hash(self.mot_de_passe_hash, mdp)

    def a_abonnement_valide(self) -> bool:
        return self.statut == 'actif' and self.date_fin_abonnement >= date.today()

    def nb_emprunts_en_cours(self) -> int:
        from models.pret import Pret
        return self.prets.filter(Pret.statut.in_(['EN_COURS', 'EN_RETARD'])).count()

    def a_penalite_impayee(self) -> bool:
        return self.penalites.filter_by(est_payee=False).first() is not None

    def emprunter(self, exemplaire, bibliothecaire):
        if not self.a_abonnement_valide():
            raise ValueError("Abonnement non valide. Contactez la bibliothèque.")
        if self.a_penalite_impayee():
            raise ValueError("Vous avez une pénalité impayée.")
        if self.nb_emprunts_en_cours() >= 3:
            raise ValueError("Vous avez déjà 3 emprunts en cours.")
        return bibliothecaire.enregistrer_pret(self, exemplaire)

    def reserver(self, ouvrage):
        from services.reservation_service import creer_reservation
        return creer_reservation(self, ouvrage)
