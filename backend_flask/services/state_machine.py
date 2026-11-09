class StateMachineError(Exception):
    """Exception levée en cas de violation de la machine à états finie de l'Exemplaire (Section 8)."""
    pass

TRANSITIONS_AUTORISEES = {
    ('DISPONIBLE', 'EMPRUNTE'): "enregistrer_pret()",
    ('EMPRUNTE', 'DISPONIBLE'): "enregistrer_retour() (aucune réservation)",
    ('EMPRUNTE', 'EN_RETARD'): "date de retour prévue dépassée",
    ('EN_RETARD', 'DISPONIBLE'): "enregistrer_retour() + enregistrer_penalite()",
    ('EMPRUNTE', 'RESERVE'): "retour avec réservation en attente",
    ('RESERVE', 'EMPRUNTE'): "enregistrer_pret() à l'adhérent qui a réservé",
    ('RESERVE', 'DISPONIBLE'): "délai de retrait expiré",
    ('EMPRUNTE', 'PERDU'): "déclaré perdu",
    ('EN_RETARD', 'PERDU'): "déclaré perdu",
    ('EN_RETARD', 'RESERVE'): "retour en retard avec réservation en attente",
}

def transition_exemplaire(exemplaire, nouvel_etat: str):
    """
    Applique la transition d'état sur l'exemplaire.
    Lève StateMachineError si non autorisée.
    """
    etat_actuel = exemplaire.etat
    if etat_actuel == nouvel_etat:
        return

    if (etat_actuel, nouvel_etat) not in TRANSITIONS_AUTORISEES:
        raise StateMachineError(
            f"Transition d'état interdite par le diagramme UML : '{etat_actuel}' -> '{nouvel_etat}'."
        )

    exemplaire.etat = nouvel_etat
