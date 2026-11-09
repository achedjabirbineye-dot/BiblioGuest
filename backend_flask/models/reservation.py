from datetime import datetime
from models.adherent import db

class Reservation(db.Model):
    __tablename__ = 'reservations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    adherent_id = db.Column(db.Integer, db.ForeignKey('adherents.id', ondelete='RESTRICT'), nullable=False)
    ouvrage_id = db.Column(db.Integer, db.ForeignKey('ouvrages.id', ondelete='RESTRICT'), nullable=False)
    date_reservation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    statut = db.Column(db.String(20), nullable=False, default='EN_ATTENTE')
    exemplaire_reserve_id = db.Column(db.Integer, db.ForeignKey('exemplaires.id'), nullable=True)
    date_expiration_retrait = db.Column(db.Date, nullable=True)

    def annuler(self):
        self.statut = 'ANNULEE'
