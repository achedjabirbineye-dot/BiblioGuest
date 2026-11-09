import os

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
