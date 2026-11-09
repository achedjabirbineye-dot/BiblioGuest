"""
Routes du Back-office Bibliothécaire
- Tableau de bord KPI et détection automatique des retards
- Comptoir d'emprunt physique (Diagramme d'activités)
- Comptoir de restitution physique avec proposition de pénalité
- Impression de carte d'adhérent avec QR Code
- Gestion des pénalités et encaissements
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from routes.auth import role_required
from models.adherent import Adherent
from models.ouvrage import Ouvrage
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.reservation import Reservation
from models.penalite import Penalite
from services.pret_service import enregistrer_pret_service, PretValidationError
from services.retour_service import evaluer_retour, enregistrer_retour_service, RetourValidationError
from services.penalite_service import regler_penalite_service, creer_penalite_manuelle_service
from services.retard_service import detecter_et_synchroniser_retards
from services.qrcode_service import generer_qr_code_base64

biblio_bp = Blueprint('bibliothecaire', __name__, url_prefix='/bibliothecaire')

@biblio_bp.route('/dashboard')
@login_required
@role_required('bibliothecaire')
def dashboard():
    # Détection automatique des retards au chargement (Section 6)
    detecter_et_synchroniser_retards()

    kpis = {
        'total_ouvrages': Ouvrage.query.count(),
        'total_exemplaires': Exemplaire.query.count(),
        'total_adherents': Adherent.query.count(),
        'prets_en_cours': Pret.query.filter_by(statut='EN_COURS').count(),
        'prets_en_retard': Pret.query.filter_by(statut='EN_RETARD').count(),
        'reservations_en_attente': Reservation.query.filter_by(statut='EN_ATTENTE').count(),
        'penalites_impayees': Penalite.query.filter_by(est_payee=False).count(),
    }
    return render_template('bibliothecaire/dashboard.html', kpis=kpis)

@biblio_bp.route('/comptoir/pret', methods=['GET', 'POST'])
@login_required
@role_required('bibliothecaire')
def comptoir_pret():
    """Enregistrement d'un prêt au comptoir (Diagramme d'activités - Section 9)."""
    if request.method == 'POST':
        numero_carte = request.form.get('numero_carte', '').strip().upper()
        code_barre = request.form.get('code_barre', '').strip().upper()

        adherent = Adherent.query.filter_by(numero_carte=numero_carte).first()
        if not adherent:
            flash("Carte non reconnue. Vérifiez auprès de l’administration.", "danger")
            return redirect(url_for('bibliothecaire.comptoir_pret'))

        exemplaire = Exemplaire.query.filter_by(code_barre=code_barre).first()
        if not exemplaire:
            flash("Code-barre exemplaire introuvable.", "danger")
            return redirect(url_for('bibliothecaire.comptoir_pret'))

        try:
            nouveau_pret = enregistrer_pret_service(current_user, adherent, exemplaire)
            flash(f"Prêt enregistré avec succès pour {adherent.prenom} {adherent.nom}. Échéance : {nouveau_pret.date_retour_prevue}.", "success")
            return redirect(url_for('bibliothecaire.comptoir_pret'))
        except PretValidationError as e:
            flash(str(e), "danger")
        except Exception as e:
            flash(f"Erreur lors de l’enregistrement : {str(e)}", "danger")

    return render_template('comptoir/pret.html')

@biblio_bp.route('/comptoir/retour', methods=['GET', 'POST'])
@login_required
@role_required('bibliothecaire')
def comptoir_retour():
    """Enregistrement d'un retour au comptoir avec proposition de pénalité (Section 9)."""
    evaluation = None

    if request.method == 'POST':
        code_barre = request.form.get('code_barre', '').strip().upper()
        confirmer_retour = request.form.get('confirmer_retour') == '1'

        exemplaire = Exemplaire.query.filter_by(code_barre=code_barre).first()
        if not exemplaire:
            flash("Code-barre exemplaire introuvable.", "danger")
            return redirect(url_for('bibliothecaire.comptoir_retour'))

        try:
            if not confirmer_retour:
                # Étape 1 : Évaluation et proposition de pénalité en cas de retard
                evaluation = evaluer_retour(exemplaire)
            else:
                # Étape 2 : Confirmation du retour et validation optionnelle de la pénalité
                valider_penalite = request.form.get('valider_penalite') == '1'
                montant = float(request.form.get('montant_penalite', 0.0))
                motif = request.form.get('motif_penalite', 'Retard de restitution')

                enregistrer_retour_service(
                    bibliothecaire=current_user,
                    exemplaire=exemplaire,
                    valider_penalite=valider_penalite,
                    montant_penalite=montant,
                    motif_penalite=motif
                )
                flash(f"Retour de l'exemplaire {code_barre} enregistré avec succès.", "success")
                return redirect(url_for('bibliothecaire.comptoir_retour'))

        except RetourValidationError as e:
            flash(str(e), "danger")
        except Exception as e:
            flash(f"Erreur : {str(e)}", "danger")

    return render_template('comptoir/retour.html', evaluation=evaluation)

@biblio_bp.route('/adherent/<int:adherent_id>/carte')
@login_required
@role_required('bibliothecaire')
def imprimer_carte_adherent(adherent_id):
    """Génération et impression de la carte de lecteur avec QR Code haute définition."""
    adherent = Adherent.query.get_or_404(adherent_id)
    qr_code_image = generer_qr_code_base64(adherent.numero_carte)
    return render_template('adherent/profil.html', adherent=adherent, qr_code_image=qr_code_image, mode_impression=True)

@biblio_bp.route('/penalite/<int:penalite_id>/regler', methods=['POST'])
@login_required
@role_required('bibliothecaire')
def regler_penalite(penalite_id):
    """Encaissement d'une pénalité au guichet."""
    penalite = Penalite.query.get_or_404(penalite_id)
    regler_penalite_service(current_user, penalite)
    flash(f"Pénalité #{penalite.id} de {int(penalite.montant)} DH encaissée et clôturée.", "success")
    return redirect(request.referrer or url_for('bibliothecaire.dashboard'))
