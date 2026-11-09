"""
Service de gestion des pénalités
Conforme à la Section 5 : jamais de création automatique sans validation du bibliothécaire.
Gestion des règlements et annulations avec motif obligatoire.
"""

from datetime import datetime
from models.adherent import db, Adherent
from models.pret import Pret
from models.penalite import Penalite

def enregistrer_penalite_service(bibliothecaire, pret: Pret, montant: float, motif: str = "Retard de restitution"):
    """
    Méthode Bibliothecaire.enregistrer_penalite() :
    Enregistre une pénalité consécutive à un prêt en retard validée par l'agent.
    """
    if montant <= 0:
        raise ValueError("Le montant de la pénalité doit être strictement positif.")

    nouvelle_penalite = Penalite(
        pret_id=pret.id,
        adherent_id=pret.adherent_id,
        montant=montant,
        est_payee=False,
        motif=motif,
        date_creation=datetime.utcnow(),
        date_reglement=None
    )

    db.session.add(nouvelle_penalite)
    db.session.commit()
    return nouvelle_penalite

def creer_penalite_manuelle_service(bibliothecaire, adherent: Adherent, montant: float, motif: str):
    """
    Enregistre une pénalité manuelle (pour perte ou dégradation) selon la Section 5.
    """
    if not motif or not motif.strip():
        raise ValueError("Le motif de la pénalité est obligatoire.")
    if montant <= 0:
        raise ValueError("Le montant doit être supérieur à 0 DH.")

    nouvelle_penalite = Penalite(
        pret_id=None,
        adherent_id=adherent.id,
        montant=montant,
        est_payee=False,
        motif=motif.strip(),
        date_creation=datetime.utcnow(),
        date_reglement=None
    )

    db.session.add(nouvelle_penalite)
    db.session.commit()
    return nouvelle_penalite

def regler_penalite_service(bibliothecaire, penalite: Penalite):
    """
    Enregistre le règlement d'une pénalité par le bibliothécaire (Section 5).
    Libère immédiatement l'adhérent pour de nouveaux emprunts.
    """
    if penalite.est_payee:
        raise ValueError("Cette pénalité a déjà été réglée.")

    penalite.est_payee = True
    penalite.date_reglement = datetime.utcnow()
    db.session.commit()
    return penalite

def annuler_penalite_service(bibliothecaire, penalite: Penalite, motif_annulation: str):
    """
    Annule une pénalité contestée ou graciée (motif obligatoire selon Section 5).
    """
    if not motif_annulation or not motif_annulation.strip():
        raise ValueError("Le motif de l'annulation est strictement obligatoire.")

    penalite.motif = f"{penalite.motif} [ANNULÉE : {motif_annulation.strip()}]"
    penalite.est_payee = True
    penalite.date_reglement = datetime.utcnow()
    db.session.commit()
    return penalite
