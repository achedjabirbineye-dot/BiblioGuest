"""
Suite de tests pytest pour la gestion de bibliothèque
Couvre obligatoirement les 5 tests exigés par la Section 13 et le rejeu du scénario temporel (Section 10).
"""

from datetime import date, timedelta
import pytest
from models.adherent import db, Adherent
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.penalite import Penalite
from services.pret_service import enregistrer_pret_service, PretValidationError
from services.retour_service import evaluer_retour, enregistrer_retour_service, calculer_penalite_proposee
from services.state_machine import transition_exemplaire, StateMachineError

# ==============================================================================
# TEST 1 : Prêt valide -> succès (Section 13.1)
# ==============================================================================
def test_pret_valide_succes(app, donnees_base):
    biblio = donnees_base['biblio']
    adherent = donnees_base['adherent_valide']
    exemplaire = donnees_base['ex1']

    pret = enregistrer_pret_service(biblio, adherent, exemplaire)

    assert pret.id is not None
    assert pret.statut == 'EN_COURS'
    assert exemplaire.etat == 'EMPRUNTE'
    assert pret.date_retour_prevue == date.today() + timedelta(days=15)
    assert pret.nb_renouvellements == 0


# ==============================================================================
# TEST 2 : Prêt refusé : abonnement expiré (Section 13.2)
# ==============================================================================
def test_pret_refuse_abonnement_expire(app, donnees_base):
    biblio = donnees_base['biblio']
    adherent_expire = donnees_base['adherent_expire']
    exemplaire = donnees_base['ex2']

    with pytest.raises(PretValidationError, match="Abonnement non valide"):
        enregistrer_pret_service(biblio, adherent_expire, exemplaire)

    # L'exemplaire doit demeurer DISPONIBLE
    assert exemplaire.etat == 'DISPONIBLE'


# ==============================================================================
# TEST 3 : Prêt refusé : exemplaire déjà emprunté (Section 13.3)
# ==============================================================================
def test_pret_refuse_exemplaire_deja_emprunte(app, donnees_base):
    biblio = donnees_base['biblio']
    adherent = donnees_base['adherent_valide']
    exemplaire = donnees_base['ex1']

    # 1er prêt accordé
    enregistrer_pret_service(biblio, adherent, exemplaire)

    # 2nd prêt sur le même exemplaire -> refus immédiat
    with pytest.raises(PretValidationError, match="Cet exemplaire n'est plus disponible"):
        enregistrer_pret_service(biblio, adherent, exemplaire)


# ==============================================================================
# TEST 4 : Retour en retard -> calcul et proposition de pénalité (Section 13.4)
# ==============================================================================
def test_retour_retard_proposition_penalite(app, donnees_base):
    # Règle : jours × 50 DH, plafonné à 100 DH
    assert calculer_penalite_proposee(jours_retard=0) == 0.00
    assert calculer_penalite_proposee(jours_retard=1) == 50.00
    assert calculer_penalite_proposee(jours_retard=2) == 100.00
    assert calculer_penalite_proposee(jours_retard=5) == 100.00 # Plafond strict 100 DH
    assert calculer_penalite_proposee(jours_retard=20) == 100.00

    # Test avec enregistrement effectif
    biblio = donnees_base['biblio']
    adherent = donnees_base['adherent_valide']
    exemplaire = donnees_base['ex1']

    # Prêt simulé dans le passé
    pret = Pret(
        adherent_id=adherent.id,
        exemplaire_id=exemplaire.id,
        bibliothecaire_id=biblio.id,
        date_pret=date.today() - timedelta(days=20),
        date_retour_prevue=date.today() - timedelta(days=5), # 5 jours de retard
        statut='EN_RETARD'
    )
    exemplaire.etat = 'EN_RETARD'
    db.session.add(pret)
    db.session.commit()

    evaluation = evaluer_retour(exemplaire)
    assert evaluation['jours_retard'] == 5
    assert evaluation['montant_propose'] == 100.00 # Plafond à 100 DH


# ==============================================================================
# TEST 5 : Transition interdite -> refusée (Section 13.5)
# ==============================================================================
def test_transition_interdite_refusee(app, donnees_base):
    exemplaire = donnees_base['ex1']
    assert exemplaire.etat == 'DISPONIBLE'

    # Transition DISPONIBLE -> EN_RETARD interdite (doit passer par EMPRUNTE)
    with pytest.raises(StateMachineError, match="Transition d'état interdite"):
        transition_exemplaire(exemplaire, 'EN_RETARD')

    # Transition DISPONIBLE -> RESERVE interdite (se fait au retour)
    with pytest.raises(StateMachineError, match="Transition d'état interdite"):
        transition_exemplaire(exemplaire, 'RESERVE')


# ==============================================================================
# TEST 6 : Rejeu du Diagramme de Temps de Référence (Section 10)
# ==============================================================================
def test_rejeu_scenario_diagramme_temps(app, donnees_base):
    """
    Rejoue pas à pas le scénario chronologique officiel du 01/10 au 05/12.
    """
    biblio = donnees_base['biblio']
    adherent = donnees_base['adherent_valide']
    exemplaire = donnees_base['ex1']

    # 1. 01/10 -> 06/10 : DISPONIBLE (ajout au catalogue)
    assert exemplaire.etat == 'DISPONIBLE'

    # 2. 06/10 -> 21/10 : EMPRUNTE (enregistrer_pret 15 jours)
    pret1 = enregistrer_pret_service(biblio, adherent, exemplaire, date_pret=date(2026, 10, 6))
    assert exemplaire.etat == 'EMPRUNTE'
    assert pret1.date_retour_prevue == date(2026, 10, 21)

    # 3. 21/10 -> 27/10 : EN_RETARD (date dépassée)
    transition_exemplaire(exemplaire, 'EN_RETARD')
    pret1.statut = 'EN_RETARD'
    assert exemplaire.etat == 'EN_RETARD'

    # 4. 27/10 -> 29/10 : DISPONIBLE (retour + enregistrer_penalite 6j x 50 DH -> max 100 DH)
    enregistrer_retour_service(
        bibliothecaire=biblio,
        exemplaire=exemplaire,
        valider_penalite=True,
        montant_penalite=100.0,
        motif_penalite="Retard constaté (6 jours)",
        date_retour=date(2026, 10, 27)
    )
    assert exemplaire.etat == 'DISPONIBLE'

    # 5. 29/10 -> 13/11 : EMPRUNTE (enregistrer_pret)
    pret2 = enregistrer_pret_service(biblio, adherent, exemplaire, date_pret=date(2026, 10, 29))
    assert exemplaire.etat == 'EMPRUNTE'

    # 6. 13/11 -> 16/11 : RESERVE (retour avec réservation)
    transition_exemplaire(exemplaire, 'RESERVE')
    assert exemplaire.etat == 'RESERVE'

    # 7. 16/11 -> 01/12 : EMPRUNTE (enregistrer_pret au réservataire)
    transition_exemplaire(exemplaire, 'EMPRUNTE')
    assert exemplaire.etat == 'EMPRUNTE'

    # 8. 01/12 -> 05/12 : DISPONIBLE (enregistrer_retour)
    transition_exemplaire(exemplaire, 'DISPONIBLE')
    assert exemplaire.etat == 'DISPONIBLE'
