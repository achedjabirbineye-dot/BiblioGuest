"""
Script d'initialisation de la base de données SQLite avec le jeu d'essai officiel (Section 14).
Données de démonstration :
- 5 ouvrages (dont 1 avec 3 exemplaires)
- 5 adhérents (ETU-2025-0001 à ETU-2025-0005, dont 1 expiré et 1 avec pénalité)
- 1 bibliothécaire (admin@biblio.ma / admin123, matricule BIB-001)
- 3 prêts (EN_COURS, EN_RETARD, CLOTURE)
- 1 réservation active (EN_ATTENTE)
- 1 pénalité impayée (100 DH)
"""

from datetime import date, datetime, timedelta
from app import create_app, db
from models.adherent import Adherent
from models.bibliothecaire import Bibliothecaire
from models.ouvrage import Ouvrage
from models.exemplaire import Exemplaire
from models.pret import Pret
from models.reservation import Reservation
from models.penalite import Penalite

def seed_database():
    app = create_app()
    with app.app_context():
        # Recréation propre des tables
        db.drop_all()
        db.create_all()
        print("✓ Tables SQLite créées avec succès.")

        # 1. Création du Bibliothécaire officiel
        biblio = Bibliothecaire(
            matricule='BIB-001',
            nom='Mansouri',
            prenom='Driss',
            email='admin@biblio.ma'
        )
        biblio.set_mot_de_passe('admin123')
        db.session.add(biblio)

        # 2. Création des 5 Adhérents (ETU-2025-0001 à ETU-2025-0005)
        # Note : ETU-2025-0004 a un abonnement expiré pour tester la Règle 1
        # ETU-2025-0005 a une pénalité impayée pour tester la Règle 4
        adherents_data = [
            {
                'numero_carte': 'ETU-2025-0001',
                'nom': 'Alami',
                'prenom': 'Karim',
                'email': 'karim.alami@univ.ma',
                'date_fin_abonnement': date(2026, 12, 31),
                'statut': 'actif',
            },
            {
                'numero_carte': 'ETU-2025-0002',
                'nom': 'Bennani',
                'prenom': 'Sara',
                'email': 'sara.bennani@univ.ma',
                'date_fin_abonnement': date(2026, 11, 30),
                'statut': 'actif',
            },
            {
                'numero_carte': 'ETU-2025-0003',
                'nom': 'Chraibi',
                'prenom': 'Yassine',
                'email': 'yassine.chraibi@univ.ma',
                'date_fin_abonnement': date(2026, 10, 15),
                'statut': 'actif',
            },
            {
                'numero_carte': 'ETU-2025-0004',
                'nom': 'Zahra',
                'prenom': 'Fatima',
                'email': 'fatima.zahra@univ.ma',
                'date_fin_abonnement': date(2024, 1, 1), # EXPIRÉ (Règle 1)
                'statut': 'actif',
            },
            {
                'numero_carte': 'ETU-2025-0005',
                'nom': 'Tazi',
                'prenom': 'Omar',
                'email': 'omar.tazi@univ.ma',
                'date_fin_abonnement': date(2026, 12, 31),
                'statut': 'actif',
            },
        ]

        adherents_objs = []
        for d in adherents_data:
            adh = Adherent(
                numero_carte=d['numero_carte'],
                nom=d['nom'],
                prenom=d['prenom'],
                email=d['email'],
                date_fin_abonnement=d['date_fin_abonnement'],
                statut=d['statut']
            )
            adh.set_mot_de_passe('secret123')
            db.session.add(adh)
            adherents_objs.append(adh)

        # 3. Création des 5 Ouvrages (dont un avec 3 exemplaires)
        ouvrages_data = [
            {
                'isbn': '978-2070612758',
                'titre': 'Le Petit Prince',
                'auteur': 'Antoine de Saint-Exupéry',
                'categorie': 'Roman',
                'editeur': 'Gallimard',
                'annee': 1943,
                'description': 'Un conte poétique et philosophique universel.',
                'nb_exemplaires': 3
            },
            {
                'isbn': '978-0132350884',
                'titre': 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'auteur': 'Robert C. Martin',
                'categorie': 'Informatique',
                'editeur': 'Prentice Hall',
                'annee': 2008,
                'description': 'Guide de référence des bonnes pratiques de développement logiciel.',
                'nb_exemplaires': 1
            },
            {
                'isbn': '978-0201633610',
                'titre': 'Design Patterns: Elements of Reusable Object-Oriented Software',
                'auteur': 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
                'categorie': 'Informatique',
                'editeur': 'Addison-Wesley',
                'annee': 1994,
                'description': 'Les 23 patrons de conception classiques du GoF.',
                'nb_exemplaires': 1
            },
            {
                'isbn': '978-2070368228',
                'titre': '1984',
                'auteur': 'George Orwell',
                'categorie': 'Science-Fiction',
                'editeur': 'Gallimard Folio',
                'annee': 1949,
                'description': 'Roman dystopique sur le totalitarisme et la surveillance.',
                'nb_exemplaires': 2
            },
            {
                'isbn': '978-2070360024',
                'titre': "L'Étranger",
                'auteur': 'Albert Camus',
                'categorie': 'Philosophie',
                'editeur': 'Gallimard',
                'annee': 1942,
                'description': 'Chef-d’œuvre de la littérature sur le sentiment de l’absurde.',
                'nb_exemplaires': 1
            },
        ]

        ouvrages_objs = []
        exemplaires_objs = []
        for idx, od in enumerate(ouvrages_data, start=1):
            ouv = Ouvrage(
                isbn=od['isbn'],
                titre=od['titre'],
                auteur=od['auteur'],
                categorie=od['categorie'],
                editeur=od['editeur'],
                annee=od['annee'],
                description=od['description']
            )
            db.session.add(ouv)
            db.session.flush() # Pour avoir ouv.id
            ouvrages_objs.append(ouv)

            for c in range(1, od['nb_exemplaires'] + 1):
                code_barre = f"EX-{str(idx).zfill(4)}-{str(c).zfill(2)}"
                ex = Exemplaire(
                    code_barre=code_barre,
                    ouvrage_id=ouv.id,
                    etat='DISPONIBLE'
                )
                db.session.add(ex)
                exemplaires_objs.append(ex)

        db.session.flush()

        # 4. Création des 3 Prêts officiels (EN_COURS, EN_RETARD, CLOTURE)
        today = date.today()

        # Prêt 1 : EN_COURS (Le Petit Prince - ex 2 emprunté par Karim Alami)
        ex_petit_prince = exemplaires_objs[1]
        ex_petit_prince.etat = 'EMPRUNTE'
        pret_en_cours = Pret(
            adherent_id=adherents_objs[0].id,
            exemplaire_id=ex_petit_prince.id,
            bibliothecaire_id=biblio.id,
            date_pret=today - timedelta(days=5),
            date_retour_prevue=today + timedelta(days=10),
            date_retour_effective=None,
            nb_renouvellements=0,
            statut='EN_COURS'
        )
        db.session.add(pret_en_cours)

        # Prêt 2 : EN_RETARD (Clean Code - ex 4 emprunté par Sara Bennani)
        ex_clean_code = exemplaires_objs[3]
        ex_clean_code.etat = 'EN_RETARD'
        pret_en_retard = Pret(
            adherent_id=adherents_objs[1].id,
            exemplaire_id=ex_clean_code.id,
            bibliothecaire_id=biblio.id,
            date_pret=today - timedelta(days=25),
            date_retour_prevue=today - timedelta(days=10), # Dépassé de 10 jours
            date_retour_effective=None,
            nb_renouvellements=0,
            statut='EN_RETARD'
        )
        db.session.add(pret_en_retard)

        # Prêt 3 : CLOTURE (Design Patterns - ex 5 restitué à temps par Yassine Chraibi)
        ex_design_patterns = exemplaires_objs[4]
        ex_design_patterns.etat = 'DISPONIBLE'
        pret_cloture = Pret(
            adherent_id=adherents_objs[2].id,
            exemplaire_id=ex_design_patterns.id,
            bibliothecaire_id=biblio.id,
            date_pret=today - timedelta(days=40),
            date_retour_prevue=today - timedelta(days=25),
            date_retour_effective=today - timedelta(days=27),
            nb_renouvellements=0,
            statut='CLOTURE'
        )
        db.session.add(pret_cloture)

        # 5. Création de la Réservation active (EN_ATTENTE) pour Design Patterns
        reservation = Reservation(
            adherent_id=adherents_objs[0].id, # Karim Alami
            ouvrage_id=ouvrages_objs[2].id,   # Design Patterns
            date_reservation=datetime.utcnow() - timedelta(days=1),
            statut='EN_ATTENTE'
        )
        db.session.add(reservation)

        # 6. Création de la Pénalité impayée (100 DH) pour Omar Tazi (ETU-2025-0005)
        penalite = Penalite(
            pret_id=None,
            adherent_id=adherents_objs[4].id, # Omar Tazi
            montant=100.0, # Plafond légal
            est_payee=False,
            motif="Retard de restitution antérieur (dépassé au plafond)",
            date_creation=datetime.utcnow() - timedelta(days=5),
            date_reglement=None
        )
        db.session.add(penalite)

        db.session.commit()
        print("✓ Jeu de données de démonstration injecté avec succès (conforme Section 14).")

if __name__ == '__main__':
    seed_database()
