from datetime import datetime
from models.adherent import db

class Penalite(db.Model):
    __tablename__ = 'penalites'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pret_id = db.Column(db.Integer, db.ForeignKey('prets.id', ondelete='RESTRICT'), unique=True, nullable=True)
    adherent_id = db.Column(db.Integer, db.ForeignKey('adherents.id', ondelete='RESTRICT'), nullable=False)
    montant = db.Column(db.Numeric(6, 2), nullable=False)
    est_payee = db.Column(db.Boolean, nullable=False, default=False)
    motif = db.Column(db.String(255), nullable=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_reglement = db.Column(db.DateTime, nullable=True)
