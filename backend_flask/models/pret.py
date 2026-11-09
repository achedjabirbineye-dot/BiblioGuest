from datetime import date, timedelta
from models.adherent import db

class Pret(db.Model):
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

    penalite = db.relationship('Penalite', backref='pret', uselist=False)

    def renouveler(self):
        if self.nb_renouvellements >= 1:
            raise ValueError("Ce prêt a déjà été renouvelé une fois.")
        if self.est_en_retard():
            raise ValueError("Impossible de renouveler un prêt en retard.")
        self.nb_renouvellements += 1
        self.date_retour_prevue += timedelta(days=15)

    def est_en_retard(self) -> bool:
        if self.date_retour_effective is not None:
            return False
        return date.today() > self.date_retour_prevue
