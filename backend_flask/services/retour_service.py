"""
Service de gestion des retours au comptoir et détection des pénalités
Strictement conforme au Diagramme d'activités (Section 9) et aux transitions UML (Section 8).
"""

from datetime import date, timedelta
from models.adherent import db
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.reservation import Reservation
from services.state_machine import transition_exemplaire
from services.penalite_service import enregistrer_penalite_service

class RetourValidationError(Exception):
    pass

def calculer_penalite_proposee(jours_retard: int, taux: float = 50.00, plafond: float = 100.00) -> float:
    """
    Calcule le montant de pénalité de retard proposé :
    jours_retard × 50 DH, plafonné obligatoirement à 100 DH.
    """
    if jours_retard <= 0:
        return 0.0
    return min(round(jours_retard * taux, 2), plafond)

def evaluer_retour(exemplaire: Exemplaire, date_retour: date = None):
    """
    Évalue un retour avant confirmation : vérifie le prêt actif et calcule le retard.
    """
    if date_retour is None:
        date_retour = date.today()

    pret_actif = Pret.query.filter(
        Pret.exemplaire_id == exemplaire.id,
        Pret.statut.in_(['EN_COURS', 'EN_RETARD'])
    ).first()

    if not pret_actif:
        raise RetourValidationError("Aucun prêt en cours pour cet exemplaire.")

    jours_retard = max(0, (date_retour - pret_actif.date_retour_prevue).days)
    montant_propose = calculer_penalite_proposee(jours_retard)

    return {
        'pret': pret_actif,
        'adherent': pret_actif.adherent,
        'jours_retard': jours_retard,
        'a_du_retard': jours_retard > 0,
        'montant_propose': montant_propose
    }

def enregistrer_retour_service(bibliothecaire, exemplaire: Exemplaire, valider_penalite: bool = False,
                               montant_penalite: float = 0.0, motif_penalite: str = "Retard de restitution",
                               date_retour: date = None):
    """
    Exécute le retour au comptoir par le bibliothécaire :
    1. Clôture le prêt
    2. Enregistre la pénalité si validée
    3. Traite la file d'attente des réservations (FIFO)
    4. Applique la transition d'état conforme (DISPONIBLE ou RESERVE)
    """
    if date_retour is None:
        date_retour = date.today()

    evaluation = evaluer_retour(exemplaire, date_retour)
    pret = evaluation['pret']

    # 1. Clôture du prêt
    pret.date_retour_effective = date_retour
    pret.statut = 'CLOTURE'

    # 2. Enregistrement de la pénalité si validée par le bibliothécaire
    if valider_penalite and montant_penalite > 0:
        enregistrer_penalite_service(
            bibliothecaire=bibliothecaire,
            pret=pret,
            montant=montant_penalite,
            motif=motif_penalite
        )

    # 3. Vérification des réservations en attente (FIFO) pour cet ouvrage
    reservation_suivante = Reservation.query.filter_by(
        ouvrage_id=exemplaire.ouvrage_id,
        statut='EN_ATTENTE'
    ).order_by(Reservation.date_reservation.asc()).first()

    if reservation_suivante:
        # Transition vers RESERVE (Section 8)
        transition_exemplaire(exemplaire, 'RESERVE')
        reservation_suivante.statut = 'DISPONIBLE'
        reservation_suivante.exemplaire_reserve_id = exemplaire.id
        reservation_suivante.date_expiration_retrait = date_retour + timedelta(days=7)
    else:
        # Transition vers DISPONIBLE (Section 8)
        transition_exemplaire(exemplaire, 'DISPONIBLE')

    db.session.commit()
    return evaluation
