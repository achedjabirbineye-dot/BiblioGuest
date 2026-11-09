from models.adherent import db

class Exemplaire(db.Model):
    __tablename__ = 'exemplaires'

    ETATS_VALIDES = ['DISPONIBLE', 'EMPRUNTE', 'EN_RETARD', 'RESERVE', 'PERDU']

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code_barre = db.Column(db.String(50), unique=True, nullable=False, index=True)
    ouvrage_id = db.Column(db.Integer, db.ForeignKey('ouvrages.id', ondelete='RESTRICT'), nullable=False)
    etat = db.Column(db.String(20), nullable=False, default='DISPONIBLE')

    prets = db.relationship('Pret', backref='exemplaire', lazy='dynamic')

    def est_disponible(self) -> bool:
        return self.etat == 'DISPONIBLE'
