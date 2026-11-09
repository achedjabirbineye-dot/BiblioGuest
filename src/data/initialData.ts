import {
  Adherent,
  Bibliothecaire,
  Exemplaire,
  Ouvrage,
  Penalite,
  Pret,
  Reservation,
  ParametresSysteme,
} from '../types';

export const PARAMETRES_DEFAUT: ParametresSysteme = {
  dureePretJours: 15,
  nbRenouvellementsMax: 1,
  maxEmpruntsSimultanes: 3,
  penaliteParJour: 50.0, // 50 DH par jour
  plafondPenalite: 100.0, // Plafonné à 100 DH
  validiteReservationJours: 7,
};

export const INITIAL_BIBLIOTHECAIRE: Bibliothecaire = {
  id: 1,
  matricule: 'BIB-001',
  nom: 'Mansouri',
  prenom: 'Driss',
  email: 'admin@biblio.ma',
};

export const INITIAL_OUVRAGES: Ouvrage[] = [
  {
    id: 1,
    isbn: '978-2070612758',
    titre: 'Le Petit Prince',
    auteur: 'Antoine de Saint-Exupéry',
    categorie: 'Roman',
    editeur: 'Gallimard',
    annee: 1943,
    description: 'Un conte philosophique intemporel et poétique sur la condition humaine, l’amitié et l’amour.',
    couvertureUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    isbn: '978-0132350884',
    titre: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    auteur: 'Robert C. Martin',
    categorie: 'Informatique',
    editeur: 'Prentice Hall',
    annee: 2008,
    description: 'Guide essentiel de bonnes pratiques de développement logiciel, d’artisanat du code et de refactorisation.',
    couvertureUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 3,
    isbn: '978-0201633610',
    titre: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    auteur: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    categorie: 'Informatique',
    editeur: 'Addison-Wesley',
    annee: 1994,
    description: 'Le livre de référence incontournable de la bande des quatre (GoF) sur les patrons de conception orientés objet.',
    couvertureUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 4,
    isbn: '978-2070368228',
    titre: '1984',
    auteur: 'George Orwell',
    categorie: 'Science-Fiction',
    editeur: 'Gallimard Folio',
    annee: 1949,
    description: 'Chef-d’œuvre dystopique sur le totalitarisme, la surveillance de masse et la falsification de la vérité par Big Brother.',
    couvertureUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 5,
    isbn: '978-2070360024',
    titre: "L'Étranger",
    auteur: 'Albert Camus',
    categorie: 'Philosophie',
    editeur: 'Gallimard',
    annee: 1942,
    description: 'Roman fondateur de la philosophie de l’absurde, décrivant le détachement de Meursault face aux conventions sociales.',
    couvertureUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
  },
];

export const INITIAL_EXEMPLAIRES: Exemplaire[] = [
  // 3 exemplaires pour "Le Petit Prince" (id: 1)
  { id: 1, code_barre: 'EX-0001-01', ouvrage_id: 1, etat: 'DISPONIBLE' },
  { id: 2, code_barre: 'EX-0001-02', ouvrage_id: 1, etat: 'EMPRUNTE' },
  { id: 3, code_barre: 'EX-0001-03', ouvrage_id: 1, etat: 'DISPONIBLE' },

  // 1 exemplaire pour Clean Code (id: 2)
  { id: 4, code_barre: 'EX-0002-01', ouvrage_id: 2, etat: 'EN_RETARD' },

  // 1 exemplaire pour Design Patterns (id: 3)
  { id: 5, code_barre: 'EX-0003-01', ouvrage_id: 3, etat: 'DISPONIBLE' },

  // 2 exemplaires pour 1984 (id: 4)
  { id: 6, code_barre: 'EX-0004-01', ouvrage_id: 4, etat: 'DISPONIBLE' },
  { id: 7, code_barre: 'EX-0004-02', ouvrage_id: 4, etat: 'DISPONIBLE' },

  // 1 exemplaire pour L'Étranger (id: 5)
  { id: 8, code_barre: 'EX-0005-01', ouvrage_id: 5, etat: 'DISPONIBLE' },
];

export const INITIAL_ADHERENTS: Adherent[] = [
  {
    id: 1,
    numero_carte: 'ETU-2025-0001',
    nom: 'Alami',
    prenom: 'Karim',
    email: 'karim.alami@univ.ma',
    date_fin_abonnement: '2026-12-31',
    statut: 'actif',
  },
  {
    id: 2,
    numero_carte: 'ETU-2025-0002',
    nom: 'Bennani',
    prenom: 'Sara',
    email: 'sara.bennani@univ.ma',
    date_fin_abonnement: '2026-11-30',
    statut: 'actif',
  },
  {
    id: 3,
    numero_carte: 'ETU-2025-0003',
    nom: 'Chraibi',
    prenom: 'Yassine',
    email: 'yassine.chraibi@univ.ma',
    date_fin_abonnement: '2026-10-15',
    statut: 'actif',
  },
  {
    id: 4,
    numero_carte: 'ETU-2025-0004',
    nom: 'Zahra',
    prenom: 'Fatima',
    email: 'fatima.zahra@univ.ma',
    date_fin_abonnement: '2024-01-01', // EXPIRÉ pour tester la règle 1 !
    statut: 'actif',
  },
  {
    id: 5,
    numero_carte: 'ETU-2025-0005',
    nom: 'Tazi',
    prenom: 'Omar',
    email: 'omar.tazi@univ.ma',
    date_fin_abonnement: '2026-12-31',
    statut: 'actif', // A une pénalité impayée pour tester la règle 4 !
  },
];

export const INITIAL_PRETS: Pret[] = [
  {
    id: 1,
    adherent_id: 1, // Karim Alami
    exemplaire_id: 2, // Le Petit Prince EX-0001-02
    bibliothecaire_id: 1,
    date_pret: '2026-10-05',
    date_retour_prevue: '2026-10-20',
    date_retour_effective: null,
    nb_renouvellements: 0,
    statut: 'EN_COURS',
  },
  {
    id: 2,
    adherent_id: 2, // Sara Bennani
    exemplaire_id: 4, // Clean Code EX-0002-01
    bibliothecaire_id: 1,
    date_pret: '2026-09-15',
    date_retour_prevue: '2026-09-30',
    date_retour_effective: null,
    nb_renouvellements: 0,
    statut: 'EN_RETARD',
  },
  {
    id: 3,
    adherent_id: 3, // Yassine Chraibi
    exemplaire_id: 5, // Design Patterns EX-0003-01
    bibliothecaire_id: 1,
    date_pret: '2026-09-01',
    date_retour_prevue: '2026-09-16',
    date_retour_effective: '2026-09-14',
    nb_renouvellements: 0,
    statut: 'CLOTURE',
  },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    adherent_id: 1, // Karim Alami
    ouvrage_id: 3, // Design Patterns
    date_reservation: '2026-10-10T14:30:00.000Z',
    statut: 'EN_ATTENTE',
    exemplaire_reserve_id: null,
    date_expiration_retrait: null,
  },
];

export const INITIAL_PENALITES: Penalite[] = [
  {
    id: 1,
    pret_id: null,
    adherent_id: 5, // Omar Tazi (ETU-2025-0005)
    montant: 100.0, // 100 DH
    est_payee: false,
    motif: 'Retard de restitution (dépassé au plafond)',
    date_creation: '2026-10-02T10:00:00.000Z',
    date_reglement: null,
  },
];
