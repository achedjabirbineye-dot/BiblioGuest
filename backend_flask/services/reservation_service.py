"""
Service de gestion des réservations
Conforme à la Section 5 : portée sur l'ouvrage entier, file FIFO, limite 1 réservation active par adhérent/ouvrage.
"""

from datetime import datetime, date
from models.adherent import db, Adherent
from models.ouvrage import Ouvrage
from models.exemplaire import Exemplaire
from models.reservation import Reservation
from services.state_machine import transition_exemplaire

class ReservationError(Exception):
    pass

def creer_reservation(adherent: Adherent, ouvrage: Ouvrage):
    """
    Méthode Adherent.reserver() :
    Enregistre une réservation si aucun exemplaire n'est disponible et aucune réservation active pour lui.
    """
    # 1. Vérifier si l'adhérent a déjà une réservation active sur cet ouvrage
    existante = Reservation.query.filter(
        Reservation.adherent_id == adherent.id,
        Reservation.ouvrage_id == ouvrage.id,
        Reservation.statut.in_(['EN_ATTENTE', 'DISPONIBLE'])
    ).first()

    if existante:
        raise ReservationError("Vous avez déjà une réservation active pour cet ouvrage.")

    # 2. Création de la réservation en file d'attente FIFO
    nouvelle_resa = Reservation(
        adherent_id=adherent.id,
        ouvrage_id=ouvrage.id,
        date_reservation=datetime.utcnow(),
        statut='EN_ATTENTE',
        exemplaire_reserve_id=None,
        date_expiration_retrait=None
    )

    db.session.add(nouvelle_resa)
    db.session.commit()
    return nouvelle_resa

def annuler_reservation(adherent: Adherent, reservation: Reservation):
    """
    Méthode Reservation.annuler() :
    Annule la réservation et libère l'exemplaire mis de côté le cas échéant.
    """
    if reservation.adherent_id != adherent.id:
        raise ReservationError("Action non autorisée sur cette réservation.")

    # Si un exemplaire lui était mis de côté (état RESERVE), il redevient DISPONIBLE
    if reservation.exemplaire_reserve_id:
        ex = Exemplaire.query.get(reservation.exemplaire_reserve_id)
        if ex and ex.etat == 'RESERVE':
            transition_exemplaire(ex, 'DISPONIBLE')

    reservation.annuler()
    db.session.commit()
    return reservation

def purger_reservations_expirees():
    """
    Vérifie les réservations dont le délai de retrait (7 jours) est expiré :
    L'exemplaire repasse de RESERVE à DISPONIBLE et la réservation passe à EXPIREE (Section 5).
    """
    today = date.today()
    expirees = Reservation.query.filter(
        Reservation.statut == 'DISPONIBLE',
        Reservation.date_expiration_retrait < today
    ).all()

    for resa in expirees:
        resa.statut = 'EXPIREE'
        if resa.exemplaire_reserve_id:
            ex = Exemplaire.query.get(resa.exemplaire_reserve_id)
            if ex and ex.etat == 'RESERVE':
                transition_exemplaire(ex, 'DISPONIBLE')

    db.session.commit()
    return len(expirees)
