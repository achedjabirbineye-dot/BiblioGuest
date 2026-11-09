"""
Service de détection automatique des retards
Strictement conforme à la Section 6 du cahier des charges :
Sans tâche planifiée, au chargement du tableau de bord et de la liste des prêts,
ce service passe en EN_RETARD tout prêt dont date_retour_prevue < aujourd'hui et date_retour_effective est vide,
et met l'exemplaire correspondant à l'état EN_RETARD.
"""

from datetime import date
from models.adherent import db
from models.pret import Pret
from models.exemplaire import Exemplaire
from services.state_machine import transition_exemplaire

def detecter_et_synchroniser_retards(date_reference: date = None):
    """
    Parcourt les prêts en cours et synchronise l'état des prêts et de leurs exemplaires vers EN_RETARD.
    """
    if date_reference is None:
        date_reference = date.today()

    prets_a_mettre_en_retard = Pret.query.filter(
        Pret.statut == 'EN_COURS',
        Pret.date_retour_prevue < date_reference,
        Pret.date_retour_effective.is_(None)
    ).all()

    nb_modifies = 0
    for pret in prets_a_mettre_en_retard:
        pret.statut = 'EN_RETARD'
        ex = Exemplaire.query.get(pret.exemplaire_id)
        if ex and ex.etat == 'EMPRUNTE':
            transition_exemplaire(ex, 'EN_RETARD')
        nb_modifies += 1

    if nb_modifies > 0:
        db.session.commit()

    return nb_modifies
