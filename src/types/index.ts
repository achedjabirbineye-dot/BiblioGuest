/**
 * Types TypeScript du système de gestion de bibliothèque
 * Strictement alignés sur les 4 diagrammes UML validés
 */

export type EtatExemplaire = 'DISPONIBLE' | 'EMPRUNTE' | 'EN_RETARD' | 'RESERVE' | 'PERDU';

export type StatutPret = 'EN_COURS' | 'EN_RETARD' | 'CLOTURE' | 'PERDU';

export type StatutReservation = 'EN_ATTENTE' | 'DISPONIBLE' | 'HONOREE' | 'EXPIREE' | 'ANNULEE';

export type StatutAdherent = 'actif' | 'suspendu' | 'inactif';

export interface Ouvrage {
  id: number;
  isbn: string;
  titre: string;
  auteur: string;
  categorie: string;
  editeur?: string;
  annee?: number;
  description?: string;
  couvertureUrl?: string;
}

export interface Exemplaire {
  id: number;
  code_barre: string; // Unique
  ouvrage_id: number; // FK
  etat: EtatExemplaire; // 5 états autorisés du diagramme UML
}

export interface Adherent {
  id: number;
  numero_carte: string; // Unique, contenu du QR Code (ex: ETU-2024-0001)
  nom: string;
  prenom: string;
  email: string; // Unique
  mot_de_passe_hash?: string;
  date_fin_abonnement: string; // YYYY-MM-DD
  statut: StatutAdherent;
}

export interface Bibliothecaire {
  id: number;
  matricule: string; // Unique
  nom: string;
  prenom: string;
  email: string; // Unique
}

export interface Pret {
  id: number;
  adherent_id: number; // FK
  exemplaire_id: number; // FK
  bibliothecaire_id: number; // FK
  date_pret: string; // YYYY-MM-DD
  date_retour_prevue: string; // YYYY-MM-DD (J+15)
  date_retour_effective?: string | null; // YYYY-MM-DD
  nb_renouvellements: number; // Max 1
  statut: StatutPret;
}

export interface Reservation {
  id: number;
  adherent_id: number; // FK
  ouvrage_id: number; // FK (porte sur l'ouvrage entier, pas sur un exemplaire précis)
  date_reservation: string; // ISO String pour FIFO
  statut: StatutReservation;
  exemplaire_reserve_id?: number | null; // Assigné quand un exemplaire passe à RESERVE
  date_expiration_retrait?: string | null; // J+7
}

export interface Penalite {
  id: number;
  pret_id?: number | null; // FK (0..1)
  adherent_id: number; // FK
  montant: number; // calculé (0.50€/j max 10€) ou manuel
  est_payee: boolean;
  motif: string;
  date_creation: string;
  date_reglement?: string | null;
}

export interface ParametresSysteme {
  dureePretJours: number; // 15 jours
  nbRenouvellementsMax: number; // 1 fois
  maxEmpruntsSimultanes: number; // 3
  penaliteParJour: number; // 0.50 €
  plafondPenalite: number; // 10.00 €
  validiteReservationJours: number; // 7 jours
}
