/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Navbar,
} from './components/Navbar';
import { ComptoirPret } from './components/ComptoirPret';
import { ComptoirRetour } from './components/ComptoirRetour';
import { CatalogueView } from './components/CatalogueView';
import { AdherentsList } from './components/AdherentsList';
import { PretsList } from './components/PretsList';
import { ReservationsPenalitesList } from './components/ReservationsPenalitesList';
import { ScenarioTemps } from './components/ScenarioTemps';
import { UmlDiagramsView } from './components/UmlDiagramsView';
import { FlaskSourceView } from './components/FlaskSourceView';
import { EspaceAdherent } from './components/EspaceAdherent';

import {
  INITIAL_ADHERENTS,
  INITIAL_BIBLIOTHECAIRE,
  INITIAL_EXEMPLAIRES,
  INITIAL_OUVRAGES,
  INITIAL_PENALITES,
  INITIAL_PRETS,
  INITIAL_RESERVATIONS,
  PARAMETRES_DEFAUT,
} from './data/initialData';

import {
  Adherent,
  Bibliothecaire,
  Exemplaire,
  Ouvrage,
  Penalite,
  Pret,
  Reservation,
} from './types';

import {
  ajouterJours,
  validerTransitionEtat,
} from './services/libraryService';

export default function App() {
  // Rôle actif : 'bibliothecaire' ou 'adherent'
  const [currentRole, setCurrentRole] = useState<'bibliothecaire' | 'adherent'>('bibliothecaire');
  const [activeAdherentId, setActiveAdherentId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('comptoir_pret');

  // Date simulée (par défaut 2026-10-12)
  const [currentSimulatedDate, setCurrentSimulatedDate] = useState<string>('2026-10-12');

  // État des données
  const [bibliothecaire, setBibliothecaire] = useState<Bibliothecaire>(INITIAL_BIBLIOTHECAIRE);
  const [adherents, setAdherents] = useState<Adherent[]>(INITIAL_ADHERENTS);
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>(INITIAL_OUVRAGES);
  const [exemplaires, setExemplaires] = useState<Exemplaire[]>(INITIAL_EXEMPLAIRES);
  const [prets, setPrets] = useState<Pret[]>(INITIAL_PRETS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [penalites, setPenalites] = useState<Penalite[]>(INITIAL_PENALITES);

  const activeAdherent = adherents.find((a) => a.id === activeAdherentId) || adherents[0];

  // Règle Section 6 : Détection des retards au chargement et changement de date
  useEffect(() => {
    let pretsModifies = false;
    const nouveauxPrets = prets.map((p) => {
      if (
        (p.statut === 'EN_COURS') &&
        p.date_retour_prevue < currentSimulatedDate &&
        !p.date_retour_effective
      ) {
        pretsModifies = true;
        return { ...p, statut: 'EN_RETARD' as const };
      }
      return p;
    });

    if (pretsModifies) {
      setPrets(nouveauxPrets);
      // Mettre à jour l'exemplaire correspondant à l'état EN_RETARD (Section 6 & 8)
      setExemplaires((prevEx) =>
        prevEx.map((ex) => {
          const pretRetard = nouveauxPrets.find(
            (p) => p.exemplaire_id === ex.id && p.statut === 'EN_RETARD'
          );
          if (pretRetard && ex.etat === 'EMPRUNTE') {
            return { ...ex, etat: 'EN_RETARD' };
          }
          return ex;
        })
      );
    }
  }, [currentSimulatedDate]);

  // Réinitialisation aux données de base du sujet
  const handleResetData = () => {
    setBibliothecaire(INITIAL_BIBLIOTHECAIRE);
    setAdherents(INITIAL_ADHERENTS);
    setOuvrages(INITIAL_OUVRAGES);
    setExemplaires(INITIAL_EXEMPLAIRES);
    setPrets(INITIAL_PRETS);
    setReservations(INITIAL_RESERVATIONS);
    setPenalites(INITIAL_PENALITES);
    setCurrentSimulatedDate('2026-10-12');
  };

  // Bascule de rôle
  const handleSwitchRole = (role: 'bibliothecaire' | 'adherent', adherentId?: number) => {
    setCurrentRole(role);
    if (adherentId) {
      setActiveAdherentId(adherentId);
    }
    if (role === 'adherent') {
      setActiveTab('espace_adherent');
    } else {
      setActiveTab('comptoir_pret');
    }
  };

  // Action : Enregistrer un prêt au comptoir (Section 9)
  const handleEnregistrerPret = (adherentId: number, exemplaireId: number) => {
    const ex = exemplaires.find((e) => e.id === exemplaireId);
    if (!ex) throw new Error('Exemplaire introuvable.');

    // Machine à états : vérification transition UML
    validerTransitionEtat(ex.etat, 'EMPRUNTE');

    const nouveauPret: Pret = {
      id: prets.length > 0 ? Math.max(...prets.map((p) => p.id)) + 1 : 1,
      adherent_id: adherentId,
      exemplaire_id: exemplaireId,
      bibliothecaire_id: bibliothecaire.id,
      date_pret: currentSimulatedDate,
      date_retour_prevue: ajouterJours(currentSimulatedDate, PARAMETRES_DEFAUT.dureePretJours),
      date_retour_effective: null,
      nb_renouvellements: 0,
      statut: 'EN_COURS',
    };

    // Si cet exemplaire était réservé, honorer la réservation
    setReservations((prev) =>
      prev.map((r) => {
        if (
          r.adherent_id === adherentId &&
          r.ouvrage_id === ex.ouvrage_id &&
          r.statut === 'DISPONIBLE'
        ) {
          return { ...r, statut: 'HONOREE' };
        }
        return r;
      })
    );

    // Mettre à jour l'exemplaire -> EMPRUNTE
    setExemplaires((prev) =>
      prev.map((e) => (e.id === exemplaireId ? { ...e, etat: 'EMPRUNTE' } : e))
    );

    setPrets((prev) => [nouveauPret, ...prev]);
  };

  // Action : Enregistrer un retour au comptoir (Section 9)
  const handleEnregistrerRetour = (
    exemplaireId: number,
    avecPenalite: boolean,
    montantPenalite?: number,
    motifPenalite?: string
  ) => {
    const ex = exemplaires.find((e) => e.id === exemplaireId);
    if (!ex) throw new Error('Exemplaire introuvable.');

    const pretActif = prets.find(
      (p) =>
        p.exemplaire_id === exemplaireId &&
        (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
    );
    if (!pretActif) throw new Error('Aucun prêt actif pour cet exemplaire.');

    // 1. Clôturer le prêt
    const pretCloture: Pret = {
      ...pretActif,
      date_retour_effective: currentSimulatedDate,
      statut: 'CLOTURE',
    };
    setPrets((prev) => prev.map((p) => (p.id === pretActif.id ? pretCloture : p)));

    // 2. Enregistrer la pénalité si validée par le bibliothécaire
    if (avecPenalite && montantPenalite && montantPenalite > 0) {
      const nouvellePenalite: Penalite = {
        id: penalites.length > 0 ? Math.max(...penalites.map((p) => p.id)) + 1 : 1,
        pret_id: pretActif.id,
        adherent_id: pretActif.adherent_id,
        montant: montantPenalite,
        est_payee: false,
        motif: motifPenalite || 'Retard de restitution au comptoir',
        date_creation: new Date().toISOString(),
        date_reglement: null,
      };
      setPenalites((prev) => [nouvellePenalite, ...prev]);
    }

    // 3. Vérifier les réservations en attente (FIFO) pour cet ouvrage
    const reservationEnAttente = reservations
      .filter((r) => r.ouvrage_id === ex.ouvrage_id && r.statut === 'EN_ATTENTE')
      .sort(
        (a, b) =>
          new Date(a.date_reservation).getTime() - new Date(b.date_reservation).getTime()
      )[0];

    if (reservationEnAttente) {
      // Transition vers RESERVE (validé Section 8)
      validerTransitionEtat(ex.etat, 'RESERVE');
      setExemplaires((prev) =>
        prev.map((e) => (e.id === exemplaireId ? { ...e, etat: 'RESERVE' } : e))
      );
      // Mettre à jour la réservation
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationEnAttente.id
            ? {
                ...r,
                statut: 'DISPONIBLE',
                exemplaire_reserve_id: ex.id,
                date_expiration_retrait: ajouterJours(
                  currentSimulatedDate,
                  PARAMETRES_DEFAUT.validiteReservationJours
                ),
              }
            : r
        )
      );
    } else {
      // Transition vers DISPONIBLE
      validerTransitionEtat(ex.etat, 'DISPONIBLE');
      setExemplaires((prev) =>
        prev.map((e) => (e.id === exemplaireId ? { ...e, etat: 'DISPONIBLE' } : e))
      );
    }
  };

  // Action : Renouveler un prêt (Section 5)
  const handleRenouvelerPret = (pretId: number) => {
    const pret = prets.find((p) => p.id === pretId);
    if (!pret) throw new Error('Prêt introuvable.');
    if (pret.nb_renouvellements >= PARAMETRES_DEFAUT.nbRenouvellementsMax) {
      throw new Error('Ce prêt a déjà été renouvelé une fois.');
    }
    if (pret.statut === 'EN_RETARD' || pret.date_retour_prevue < currentSimulatedDate) {
      throw new Error('Impossible de renouveler un prêt en retard.');
    }

    const nouvelleEcheance = ajouterJours(
      pret.date_retour_prevue,
      PARAMETRES_DEFAUT.dureePretJours
    );
    setPrets((prev) =>
      prev.map((p) =>
        p.id === pretId
          ? {
              ...p,
              nb_renouvellements: p.nb_renouvellements + 1,
              date_retour_prevue: nouvelleEcheance,
            }
          : p
      )
    );
  };

  // Action : Réserver un ouvrage (Section 5)
  const handleReserverOuvrage = (ouvrageId: number) => {
    if (!activeAdherent) throw new Error('Adhérent non identifié.');

    // Vérifier réservation active existante
    const existante = reservations.find(
      (r) =>
        r.ouvrage_id === ouvrageId &&
        r.adherent_id === activeAdherent.id &&
        (r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE')
    );
    if (existante) {
      throw new Error('Vous avez déjà une réservation active pour cet ouvrage.');
    }

    const nouvelleResa: Reservation = {
      id: reservations.length > 0 ? Math.max(...reservations.map((r) => r.id)) + 1 : 1,
      adherent_id: activeAdherent.id,
      ouvrage_id: ouvrageId,
      date_reservation: new Date().toISOString(),
      statut: 'EN_ATTENTE',
      exemplaire_reserve_id: null,
      date_expiration_retrait: null,
    };
    setReservations((prev) => [...prev, nouvelleResa]);
  };

  // Action : Annuler réservation
  const handleAnnulerReservation = (reservationId: number) => {
    const resa = reservations.find((r) => r.id === reservationId);
    if (!resa) return;

    // Si un exemplaire était mis de côté (RESERVE), il redevient DISPONIBLE
    if (resa.exemplaire_reserve_id) {
      validerTransitionEtat('RESERVE', 'DISPONIBLE');
      setExemplaires((prev) =>
        prev.map((e) =>
          e.id === resa.exemplaire_reserve_id ? { ...e, etat: 'DISPONIBLE' } : e
        )
      );
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, statut: 'ANNULEE' } : r))
    );
  };

  // Action : Régler pénalité
  const handleReglerPenalite = (penaliteId: number) => {
    setPenalites((prev) =>
      prev.map((p) =>
        p.id === penaliteId
          ? {
              ...p,
              est_payee: true,
              date_reglement: new Date().toISOString(),
            }
          : p
      )
    );
  };

  // Action : Créer pénalité manuelle (dégradation / perte)
  const handleCreerPenaliteManuelle = (
    adherentId: number,
    montant: number,
    motif: string
  ) => {
    const nouvellePenalite: Penalite = {
      id: penalites.length > 0 ? Math.max(...penalites.map((p) => p.id)) + 1 : 1,
      pret_id: null,
      adherent_id: adherentId,
      montant,
      est_payee: false,
      motif,
      date_creation: new Date().toISOString(),
      date_reglement: null,
    };
    setPenalites((prev) => [nouvellePenalite, ...prev]);
  };

  // Action : Ajouter un ouvrage (ISBN, titre, auteur, catégorie)
  const handleAjouterOuvrage = (nouvelOuvrage: {
    isbn: string;
    titre: string;
    auteur: string;
    categorie: string;
  }) => {
    const isbnNettoye = nouvelOuvrage.isbn.trim();
    if (!isbnNettoye || !nouvelOuvrage.titre.trim() || !nouvelOuvrage.auteur.trim() || !nouvelOuvrage.categorie.trim()) {
      throw new Error("Tous les champs (ISBN, titre, auteur, catégorie) sont obligatoires.");
    }

    const isbnExistant = ouvrages.some(
      (o) => o.isbn.trim().toUpperCase() === isbnNettoye.toUpperCase()
    );
    if (isbnExistant) {
      throw new Error(`Un ouvrage avec l'ISBN « ${isbnNettoye} » existe déjà au catalogue.`);
    }

    const newId = ouvrages.length > 0 ? Math.max(...ouvrages.map((o) => o.id)) + 1 : 1;
    const book: Ouvrage = {
      id: newId,
      isbn: isbnNettoye,
      titre: nouvelOuvrage.titre.trim(),
      auteur: nouvelOuvrage.auteur.trim(),
      categorie: nouvelOuvrage.categorie.trim(),
      annee: new Date().getFullYear(),
      description: `Ouvrage enregistré au catalogue.`,
      couvertureUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    };
    setOuvrages((prev) => [book, ...prev]);
    return book;
  };

  // Action : Ajouter un exemplaire (code-barre unique, état initial DISPONIBLE, refuse un code-barre déjà utilisé)
  const handleAjouterExemplaire = (ouvrageId: number, codeBarre: string) => {
    const codeNettoye = codeBarre.trim().toUpperCase();
    if (!codeNettoye) {
      throw new Error("Le code-barre est obligatoire.");
    }

    // Refuse un code-barre déjà utilisé
    const dejaUtilise = exemplaires.some(
      (e) => e.code_barre.trim().toUpperCase() === codeNettoye
    );
    if (dejaUtilise) {
      throw new Error(`Le code-barre « ${codeNettoye} » est déjà utilisé par un autre exemplaire.`);
    }

    const newCopy: Exemplaire = {
      id: exemplaires.length > 0 ? Math.max(...exemplaires.map((e) => e.id)) + 1 : 1,
      code_barre: codeNettoye,
      ouvrage_id: ouvrageId,
      etat: 'DISPONIBLE', // État initial obligatoirement DISPONIBLE
    };
    setExemplaires((prev) => [...prev, newCopy]);
    return newCopy;
  };

  // Action : Déclarer un exemplaire perdu (Section 8)
  const handleDeclarerPerdu = (exemplaireId: number) => {
    const ex = exemplaires.find((e) => e.id === exemplaireId);
    if (!ex) return;

    validerTransitionEtat(ex.etat, 'PERDU');
    setExemplaires((prev) =>
      prev.map((e) => (e.id === exemplaireId ? { ...e, etat: 'PERDU' } : e))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Navigation principale */}
      <Navbar
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        bibliothecaire={bibliothecaire}
        adherents={adherents}
        activeAdherent={activeAdherent}
        currentSimulatedDate={currentSimulatedDate}
        onChangeSimulatedDate={setCurrentSimulatedDate}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'comptoir_pret' && (
          <ComptoirPret
            bibliothecaire={bibliothecaire}
            adherents={adherents}
            ouvrages={ouvrages}
            exemplaires={exemplaires}
            prets={prets}
            penalites={penalites}
            reservations={reservations}
            currentSimulatedDate={currentSimulatedDate}
            onEnregistrerPret={handleEnregistrerPret}
          />
        )}

        {activeTab === 'comptoir_retour' && (
          <ComptoirRetour
            bibliothecaire={bibliothecaire}
            exemplaires={exemplaires}
            prets={prets}
            ouvrages={ouvrages}
            adherents={adherents}
            reservations={reservations}
            currentSimulatedDate={currentSimulatedDate}
            parametres={PARAMETRES_DEFAUT}
            onEnregistrerRetour={handleEnregistrerRetour}
          />
        )}

        {activeTab === 'catalogue' && (
          <CatalogueView
            ouvrages={ouvrages}
            exemplaires={exemplaires}
            reservations={reservations}
            currentRole={currentRole}
            activeAdherent={activeAdherent}
            onReserverOuvrage={handleReserverOuvrage}
            onAjouterOuvrage={handleAjouterOuvrage}
            onAjouterExemplaire={handleAjouterExemplaire}
            onDeclarerPerdu={handleDeclarerPerdu}
          />
        )}

        {activeTab === 'adherents' && (
          <AdherentsList
            adherents={adherents}
            prets={prets}
            penalites={penalites}
            currentSimulatedDate={currentSimulatedDate}
            onSelectForPret={(numCarte) => {
              setActiveTab('comptoir_pret');
            }}
          />
        )}

        {activeTab === 'prets' && (
          <PretsList
            prets={prets}
            exemplaires={exemplaires}
            ouvrages={ouvrages}
            adherents={adherents}
            bibliothecaires={[bibliothecaire]}
            currentSimulatedDate={currentSimulatedDate}
            onRenouvelerPret={handleRenouvelerPret}
          />
        )}

        {activeTab === 'reservations_penalites' && (
          <ReservationsPenalitesList
            reservations={reservations}
            penalites={penalites}
            adherents={adherents}
            ouvrages={ouvrages}
            currentRole={currentRole}
            activeAdherent={activeAdherent}
            onAnnulerReservation={handleAnnulerReservation}
            onReglerPenalite={handleReglerPenalite}
            onCreerPenaliteManuelle={handleCreerPenaliteManuelle}
          />
        )}

        {activeTab === 'scenario_temps' && (
          <ScenarioTemps
            onSyncSimulatedDate={(d) => setCurrentSimulatedDate(d)}
          />
        )}

        {activeTab === 'diagrammes_uml' && <UmlDiagramsView />}

        {activeTab === 'code_flask' && <FlaskSourceView />}

        {activeTab === 'espace_adherent' && (
          <EspaceAdherent
            adherent={activeAdherent}
            ouvrages={ouvrages}
            exemplaires={exemplaires}
            prets={prets}
            reservations={reservations}
            penalites={penalites}
            currentSimulatedDate={currentSimulatedDate}
            onNavigateToCatalogue={() => setActiveTab('catalogue')}
            onAnnulerReservation={handleAnnulerReservation}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <span>BiblioGest • TP Outils & Méthodes de Développement Logiciel</span>
        </div>
      </footer>
    </div>
  );
}
