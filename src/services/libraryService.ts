/**
 * Service métier de gestion de la bibliothèque
 * Strictement aligné sur les 4 diagrammes UML :
 * - Machine à états finie de l'Exemplaire (Section 8)
 * - Diagramme d'activités pour le prêt et le retour au comptoir (Section 9)
 * - Règles de gestion (Section 5)
 * - Messages d'erreur obligatoires (Section 7)
 */

import {
  Adherent,
  Bibliothecaire,
  EtatExemplaire,
  Exemplaire,
  Ouvrage,
  ParametresSysteme,
  Penalite,
  Pret,
  Reservation,
  StatutPret,
} from '../types';

export class LibraryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LibraryValidationError';
  }
}

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export interface TransitionRule {
  from: EtatExemplaire;
  to: EtatExemplaire;
  evenement: string;
}

// Transitions autorisées selon le Diagramme d'états validé (Section 8)
export const TRANSITIONS_AUTORISEES: TransitionRule[] = [
  { from: 'DISPONIBLE', to: 'EMPRUNTE', evenement: 'enregistrer_pret()' },
  { from: 'EMPRUNTE', to: 'DISPONIBLE', evenement: 'enregistrer_retour() (aucune réservation)' },
  { from: 'EMPRUNTE', to: 'EN_RETARD', evenement: 'date de retour prévue dépassée' },
  { from: 'EN_RETARD', to: 'DISPONIBLE', evenement: 'enregistrer_retour() + enregistrer_penalite()' },
  { from: 'EMPRUNTE', to: 'RESERVE', evenement: 'retour avec réservation en attente' },
  { from: 'RESERVE', to: 'EMPRUNTE', evenement: 'enregistrer_pret() à l’adhérent qui a réservé' },
  { from: 'RESERVE', to: 'DISPONIBLE', evenement: 'délai de retrait expiré' },
  { from: 'EMPRUNTE', to: 'PERDU', evenement: 'déclaré perdu' },
  { from: 'EN_RETARD', to: 'PERDU', evenement: 'déclaré perdu' },
  // Note de bas de tableau Section 8 : retour depuis EN_RETARD avec réservation
  { from: 'EN_RETARD', to: 'RESERVE', evenement: 'retour en retard avec réservation en attente' },
];

export function validerTransitionEtat(from: EtatExemplaire, to: EtatExemplaire): void {
  const transitionValide = TRANSITIONS_AUTORISEES.some(
    (t) => t.from === from && t.to === to
  );

  if (!transitionValide) {
    throw new StateMachineError(
      `Transition d'état non autorisée selon le diagramme UML : de '${from}' vers '${to}'. Seules les transitions spécifiées à la section 8 sont permises.`
    );
  }
}

export function formaterDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ajouterJours(dateStr: string, jours: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + jours);
  return formaterDateYMD(date);
}

export function calculerDifferenceJours(dateA: string, dateB: string): number {
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  const diffTime = dA.getTime() - dB.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export interface VerificationPretResult {
  valide: boolean;
  erreur?: string;
  adherent?: Adherent;
  exemplaire?: Exemplaire;
  ouvrage?: Ouvrage;
  reservationLiee?: Reservation;
}

export function verifierEligibilitePret(
  numeroCarte: string,
  codeBarre: string,
  adherents: Adherent[],
  exemplaires: Exemplaire[],
  ouvrages: Ouvrage[],
  prets: Pret[],
  penalites: Penalite[],
  reservations: Reservation[],
  dateCourante: string
): VerificationPretResult {
  // 1. Recherche de l'adhérent
  const adherent = adherents.find(
    (a) => a.numero_carte.trim().toUpperCase() === numeroCarte.trim().toUpperCase()
  );
  if (!adherent) {
    return {
      valide: false,
      erreur: 'Carte non reconnue. Vérifiez auprès de l’administration.',
    };
  }

  // 2. Recherche de l'exemplaire
  const exemplaire = exemplaires.find(
    (e) => e.code_barre.trim().toUpperCase() === codeBarre.trim().toUpperCase()
  );
  if (!exemplaire) {
    return {
      valide: false,
      erreur: 'Code-barre exemplaire introuvable dans le catalogue.',
    };
  }

  const ouvrage = ouvrages.find((o) => o.id === exemplaire.ouvrage_id);

  // Règle 1 : Abonnement valide et compte actif
  const abonnementExpire = adherent.date_fin_abonnement < dateCourante;
  if (abonnementExpire || adherent.statut !== 'actif') {
    return {
      valide: false,
      erreur: 'Abonnement non valide. Contactez la bibliothèque.',
      adherent,
      exemplaire,
      ouvrage,
    };
  }

  // Règle 4 (vérifiée avant le quota selon bon sens d'éligibilité) : Pénalité impayée
  const penaliteImpayee = penalites.find(
    (p) => p.adherent_id === adherent.id && !p.est_payee
  );
  if (penaliteImpayee) {
    return {
      valide: false,
      erreur: `Vous avez une pénalité impayée de ${penaliteImpayee.montant.toFixed(0)} DH.`,
      adherent,
      exemplaire,
      ouvrage,
    };
  }

  // Règle 3 : Quota max 3 emprunts en cours
  const empruntsEnCours = prets.filter(
    (p) =>
      p.adherent_id === adherent.id &&
      (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
  );
  if (empruntsEnCours.length >= 3) {
    return {
      valide: false,
      erreur: 'Vous avez déjà 3 emprunts en cours.',
      adherent,
      exemplaire,
      ouvrage,
    };
  }

  // Règle 2 : Exemplaire disponible ou réservé pour cet adhérent
  let reservationLiee: Reservation | undefined;
  if (exemplaire.etat === 'RESERVE') {
    reservationLiee = reservations.find(
      (r) =>
        r.ouvrage_id === exemplaire.ouvrage_id &&
        r.statut === 'DISPONIBLE' &&
        r.adherent_id === adherent.id &&
        (r.exemplaire_reserve_id === exemplaire.id || !r.exemplaire_reserve_id)
    );
    if (!reservationLiee) {
      return {
        valide: false,
        erreur: 'Cet exemplaire est réservé pour un autre adhérent.',
        adherent,
        exemplaire,
        ouvrage,
      };
    }
  } else if (exemplaire.etat !== 'DISPONIBLE') {
    return {
      valide: false,
      erreur: 'Cet exemplaire n’est plus disponible.',
      adherent,
      exemplaire,
      ouvrage,
    };
  }

  return {
    valide: true,
    adherent,
    exemplaire,
    ouvrage,
    reservationLiee,
  };
}

export function verifierEligibiliteRetour(
  codeBarre: string,
  exemplaires: Exemplaire[],
  prets: Pret[],
  ouvrages: Ouvrage[],
  adherents: Adherent[],
  dateCourante: string,
  params: ParametresSysteme
) {
  const exemplaire = exemplaires.find(
    (e) => e.code_barre.trim().toUpperCase() === codeBarre.trim().toUpperCase()
  );
  if (!exemplaire) {
    throw new LibraryValidationError('Code-barre exemplaire introuvable.');
  }

  const pretActif = prets.find(
    (p) =>
      p.exemplaire_id === exemplaire.id &&
      (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
  );

  if (!pretActif) {
    throw new LibraryValidationError('Aucun prêt en cours pour cet exemplaire.');
  }

  const adherent = adherents.find((a) => a.id === pretActif.adherent_id);
  const ouvrage = ouvrages.find((o) => o.id === exemplaire.ouvrage_id);

  // Vérification retard
  const joursRetard = Math.max(
    0,
    calculerDifferenceJours(dateCourante, pretActif.date_retour_prevue)
  );
  const aDuRetard = joursRetard > 0;
  const montantPenalite = aDuRetard
    ? Math.min(joursRetard * params.penaliteParJour, params.plafondPenalite)
    : 0;

  return {
    exemplaire,
    pret: pretActif,
    adherent,
    ouvrage,
    joursRetard,
    aDuRetard,
    montantPenalite,
  };
}
