"""
Routes de l'Espace Adhérent
Périmètre volontairement limité (Section 3 du cahier des charges) :
- Consulter son profil et sa carte QR
- Consulter ses prêts en cours, historique et pénalités
- Annuler une réservation
- AUCUN emprunt ni retour possible en ligne (comptoir physique exclusif)
"""

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from routes.auth import role_required
from models.reservation import Reservation
from services.reservation_service import annuler_reservation, ReservationError
from services.qrcode_service import generer_qr_code_base64

adherent_bp = Blueprint('adherent', __name__, url_prefix='/adherent')

@adherent_bp.route('/mon-espace')
@login_required
@role_required('adherent')
def mon_espace():
    adherent = current_user
    prets_actifs = adherent.prets.filter(current_user.prets.property.mapper.class_.statut.in_(['EN_COURS', 'EN_RETARD'])).all()
    historique_prets = adherent.prets.filter_by(statut='CLOTURE').all()
    reservations = adherent.reservations.all()
    penalites = adherent.penalites.all()

    qr_code_image = generer_qr_code_base64(adherent.numero_carte)

    return render_template(
        'adherent/mes_emprunts.html',
        adherent=adherent,
        prets_actifs=prets_actifs,
        historique_prets=historique_prets,
        reservations=reservations,
        penalites=penalites,
        qr_code_image=qr_code_image
    )

@adherent_bp.route('/reservation/<int:reservation_id>/annuler', methods=['POST'])
@login_required
@role_required('adherent')
def annuler_ma_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    try:
        annuler_reservation(current_user, reservation)
        flash("Votre réservation a été annulée avec succès.", "success")
    except ReservationError as e:
        flash(str(e), "danger")
    return redirect(url_for('adherent.mon_espace'))
