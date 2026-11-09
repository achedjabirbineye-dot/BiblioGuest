from werkzeug.security import generate_password_hash, check_password_hash
from models.adherent import db

class Bibliothecaire(db.Model):
    __tablename__ = 'bibliothecaires'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    matricule = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=False)

    prets_enregistres = db.relationship('Pret', backref='bibliothecaire', lazy='dynamic')

    def set_mot_de_passe(self, mdp):
        self.mot_de_passe_hash = generate_password_hash(mdp)

    def verifier_mot_de_passe(self, mdp):
        return check_password_hash(self.mot_de_passe_hash, mdp)

    def enregistrer_pret(self, adherent, exemplaire):
        from services.pret_service import enregistrer_pret_service
        return enregistrer_pret_service(self, adherent, exemplaire)

    def enregistrer_retour(self, exemplaire):
        from services.retour_service import enregistrer_retour_service
        return enregistrer_retour_service(self, exemplaire)

    def enregistrer_penalite(self, pret, montant, motif="Retard de restitution"):
        from services.penalite_service import enregistrer_penalite_service
        return enregistrer_penalite_service(self, pret, montant, motif)
