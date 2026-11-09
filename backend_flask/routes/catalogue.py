"""
Routes du Catalogue et Réservations
Recherche publique/adhérent (titre, auteur, catégorie, tri, pagination 10/25/50).
Fiche détaillée et bouton de réservation pour adhérents si indisponible.
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models.ouvrage import Ouvrage
from models.adherent import Adherent
from services.reservation_service import creer_reservation, ReservationError

catalogue_bp = Blueprint('catalogue', __name__, url_prefix='/catalogue')

@catalogue_bp.route('/')
def index():
    recherche = request.args.get('q', '').strip()
    categorie = request.args.get('categorie', 'all')
    tri = request.args.get('tri', 'titre')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = Ouvrage.query

    if recherche:
        query = query.filter(
            (Ouvrage.titre.ilike(f'%{recherche}%')) |
            (Ouvrage.auteur.ilike(f'%{recherche}%')) |
            (Ouvrage.isbn.ilike(f'%{recherche}%'))
        )

    if categorie and categorie != 'all':
        query = query.filter_by(categorie=categorie)

    if tri == 'auteur':
        query = query.order_by(Ouvrage.auteur.asc())
    elif tri == 'annee':
        query = query.order_by(Ouvrage.annee.desc())
    else:
        query = query.order_by(Ouvrage.titre.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    categories = [c[0] for c in Ouvrage.query.with_entities(Ouvrage.categorie).distinct()]

    return render_template(
        'catalogue/liste.html',
        pagination=pagination,
        categories=categories,
        recherche=recherche,
        selected_category=categorie,
        selected_tri=tri,
        per_page=per_page
    )

@catalogue_bp.route('/ouvrage/<int:ouvrage_id>')
def detail(ouvrage_id):
    ouvrage = Ouvrage.query.get_or_404(ouvrage_id)
    exemplaires = ouvrage.exemplaires.all()
    nb_disponibles = sum(1 for e in exemplaires if e.etat == 'DISPONIBLE')
    return render_template('catalogue/fiche.html', ouvrage=ouvrage, exemplaires=exemplaires, nb_disponibles=nb_disponibles)

@catalogue_bp.route('/ouvrage/<int:ouvrage_id>/reserver', methods=['POST'])
@login_required
def reserver(ouvrage_id):
    """Réservation d'un ouvrage indisponible par l'adhérent connecté (Section 5)."""
    if not isinstance(current_user, Adherent):
        flash("Seuls les adhérents peuvent réserver un ouvrage.", "warning")
        return redirect(url_for('catalogue.detail', ouvrage_id=ouvrage_id))

    ouvrage = Ouvrage.query.get_or_404(ouvrage_id)
    try:
        creer_reservation(current_user, ouvrage)
        flash(f"Réservation enregistrée pour « {ouvrage.titre} ». Vous serez notifié lors de la restitution d’un exemplaire.", "success")
    except ReservationError as e:
        flash(str(e), "danger")

    return redirect(url_for('catalogue.detail', ouvrage_id=ouvrage_id))
