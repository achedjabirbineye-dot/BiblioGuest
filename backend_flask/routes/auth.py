"""
Routes d'authentification (Flask-Login)
- Bibliothécaire : email + mot de passe
- Adhérent : numéro de carte (scan QR ou saisie manuelle) + mot de passe de secours
"""

from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from models.adherent import Adherent
from models.bibliothecaire import Bibliothecaire

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def role_required(role):
    """Décorateur pour restreindre l'accès à un rôle spécifique ('bibliothecaire' ou 'adherent')."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login_bibliothecaire'))
            user_role = 'bibliothecaire' if isinstance(current_user, Bibliothecaire) else 'adherent'
            if user_role != role:
                flash("Accès non autorisé pour votre profil.", "danger")
                return redirect(url_for('catalogue.index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/login/bibliothecaire', methods=['GET', 'POST'])
def login_bibliothecaire():
    if current_user.is_authenticated:
        return redirect(url_for('bibliothecaire.dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        mot_de_passe = request.form.get('mot_de_passe', '')

        biblio = Bibliothecaire.query.filter_by(email=email).first()
        if biblio and biblio.verifier_mot_de_passe(mot_de_passe):
            login_user(biblio)
            flash(f"Bienvenue, {biblio.prenom} {biblio.nom} !", "success")
            return redirect(url_for('bibliothecaire.dashboard'))

        flash("Identifiants incorrects.", "danger")

    return render_template('auth/login_biblio.html')

@auth_bp.route('/login/adherent', methods=['GET', 'POST'])
def login_adherent():
    if current_user.is_authenticated:
        return redirect(url_for('adherent.mon_espace'))

    if request.method == 'POST':
        numero_carte = request.form.get('numero_carte', '').strip().upper()
        mot_de_passe = request.form.get('mot_de_passe', '').strip()

        adh = Adherent.query.filter_by(numero_carte=numero_carte).first()
        if not adh:
            flash("Carte non reconnue. Vérifiez auprès de l’administration.", "danger")
            return render_template('auth/login_adherent.html')

        # Connexion directe par carte scannée ou vérification du mot de passe de secours
        if not mot_de_passe or adh.verifier_mot_de_passe(mot_de_passe):
            login_user(adh)
            flash(f"Bienvenue dans votre espace lecteur, {adh.prenom} !", "success")
            return redirect(url_for('adherent.mon_espace'))

        flash("Mot de passe incorrect.", "danger")

    return render_template('auth/login_adherent.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Vous êtes déconnecté.", "info")
    return redirect(url_for('catalogue.index'))
