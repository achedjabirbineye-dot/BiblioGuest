from models.adherent import db

class Ouvrage(db.Model):
    __tablename__ = 'ouvrages'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    isbn = db.Column(db.String(20), unique=True, nullable=False, index=True)
    titre = db.Column(db.String(255), nullable=False, index=True)
    auteur = db.Column(db.String(255), nullable=False, index=True)
    categorie = db.Column(db.String(100), nullable=False, index=True)
    editeur = db.Column(db.String(150), nullable=True)
    annee = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)

    exemplaires = db.relationship('Exemplaire', backref='ouvrage', lazy='dynamic')
    reservations = db.relationship('Reservation', backref='ouvrage', lazy='dynamic')
