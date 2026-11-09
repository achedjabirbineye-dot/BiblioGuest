"""
Service de gestion des prêts au comptoir
Strictement conforme au Diagramme d'activités (Section 9) et aux 4 règles de gestion (Section 5).
"""

from datetime import date, timedelta
from models.adherent import db, Adherent
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.reservation import Reservation
from services.state_machine import transition_exemplaire

class PretValidationError(Exception):
    """Exception levée en cas de refus d'un prêt selon les messages officiels de la Section 7."""
    pass

def verifier_eligibilite_pret(adherent: Adherent, exemplaire: Exemplaire, date_reference: date = None):
    """
    Vérifie les 4 règles de gestion pour autoriser un prêt :
    1. Abonnement valide et compte actif
    2. Exemplaire disponible (ou réservé pour cet adhérent)
    3. Quota d'emprunts simultanés < 3
    4. Aucune pénalité impayée
    """
    if date_reference is None:
        date_reference = date.today()

    # Règle 1 : Abonnement non expiré et compte actif
    if adherent.statut != 'actif' or adherent.date_fin_abonnement < date_reference:
        raise PretValidationError("Abonnement non valide. Contactez la bibliothèque.")

    # Règle 4 : Pénalité impayée (prioritaire)
    penalite_impayee = adherent.penalites.filter_by(est_payee=False).first()
    if penalite_impayee:
        montant_str = f"{int(penalite_impayee.montant)} DH"
        raise PretValidationError(f"Vous avez une pénalité impayée de {montant_str}.")

    # Règle 3 : Quota maximal de 3 emprunts en cours
    nb_en_cours = adherent.prets.filter(Pret.statut.in_(['EN_COURS', 'EN_RETARD'])).count()
    if nb_en_cours >= 3:
        raise PretValidationError("Vous avez déjà 3 emprunts en cours.")

    # Règle 2 : Exemplaire disponible ou réservé pour lui
    if exemplaire.etat == 'RESERVE':
        resa = Reservation.query.filter_by(
            ouvrage_id=exemplaire.ouvrage_id,
            adherent_id=adherent.id,
            statut='DISPONIBLE'
        ).first()
        if not resa:
            raise PretValidationError("Cet exemplaire n'est plus disponible.")
    elif exemplaire.etat != 'DISPONIBLE':
        raise PretValidationError("Cet exemplaire n'est plus disponible.")

    return True

def enregistrer_pret_service(bibliothecaire, adherent: Adherent, exemplaire: Exemplaire, date_pret: date = None):
    """
    Enregistre un nouveau prêt au comptoir par le bibliothécaire (Section 9).
    Exécute les transitions d'état et commit dans une transaction atomique.
    """
    if date_pret is None:
        date_pret = date.today()

    # 1. Contrôle des 4 règles de gestion
    verifier_eligibilite_pret(adherent, exemplaire, date_pret)

    # 2. Si l'exemplaire était réservé par cet adhérent, honorer la réservation
    if exemplaire.etat == 'RESERVE':
        resa = Reservation.query.filter_by(
            ouvrage_id=exemplaire.ouvrage_id,
            adherent_id=adherent.id,
            statut='DISPONIBLE'
        ).first()
        if resa:
            resa.statut = 'HONOREE'

    # 3. Transition d'état de l'exemplaire -> EMPRUNTE (Section 8)
    transition_exemplaire(exemplaire, 'EMPRUNTE')

    # 4. Création du prêt (15 jours)
    nouveau_pret = Pret(
        adherent_id=adherent.id,
        exemplaire_id=exemplaire.id,
        bibliothecaire_id=bibliothecaire.id,
        date_pret=date_pret,
        date_retour_prevue=date_pret + timedelta(days=15),
        date_retour_effective=None,
        nb_renouvellements=0,
        statut='EN_COURS'
    )

    db.session.add(nouveau_pret)
    db.session.commit()
    return nouveau_pret
