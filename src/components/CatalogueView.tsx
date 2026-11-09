import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Filter,
  Layers,
  Plus,
  Search,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { Adherent, EtatExemplaire, Exemplaire, Ouvrage, Reservation } from '../types';

interface CatalogueViewProps {
  ouvrages: Ouvrage[];
  exemplaires: Exemplaire[];
  reservations: Reservation[];
  currentRole: 'bibliothecaire' | 'adherent';
  activeAdherent?: Adherent;
  onReserverOuvrage: (ouvrageId: number) => void;
  onAjouterOuvrage: (ouvrage: {
    isbn: string;
    titre: string;
    auteur: string;
    categorie: string;
  }) => void;
  onAjouterExemplaire: (ouvrageId: number, codeBarre: string) => void;
  onDeclarerPerdu: (exemplaireId: number) => void;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  ouvrages,
  exemplaires,
  reservations,
  currentRole,
  activeAdherent,
  onReserverOuvrage,
  onAjouterOuvrage,
  onAjouterExemplaire,
  onDeclarerPerdu,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'titre' | 'auteur' | 'annee'>('titre');
  const [selectedOuvrageId, setSelectedOuvrageId] = useState<number | null>(1);
  const [actionMessage, setActionMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Formulaire « Ajouter un ouvrage » (ISBN, titre, auteur, catégorie)
  const [showAddOuvrage, setShowAddOuvrage] = useState<boolean>(false);
  const [newIsbn, setNewIsbn] = useState('');
  const [newTitre, setNewTitre] = useState('');
  const [newAuteur, setNewAuteur] = useState('');
  const [newCategorie, setNewCategorie] = useState('');

  // Formulaire « Ajouter un exemplaire » (code-barre unique, état initial DISPONIBLE)
  const [showAddExemplaire, setShowAddExemplaire] = useState<boolean>(false);
  const [inputCodeBarre, setInputCodeBarre] = useState('');

  // Catégories uniques
  const categories = Array.from(new Set(ouvrages.map((o) => o.categorie)));

  // Filtrage et tri
  const filteredOuvrages = ouvrages
    .filter((o) => {
      const matchSearch =
        o.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.auteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.isbn.includes(searchTerm);
      const matchCat = selectedCategory === 'all' || o.categorie === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'titre') return a.titre.localeCompare(b.titre);
      if (sortBy === 'auteur') return a.auteur.localeCompare(b.auteur);
      return (b.annee || 0) - (a.annee || 0);
    });

  const selectedOuvrage =
    ouvrages.find((o) => o.id === selectedOuvrageId) || filteredOuvrages[0];

  const exemplairesDuLivre = selectedOuvrage
    ? exemplaires.filter((e) => e.ouvrage_id === selectedOuvrage.id)
    : [];

  const nbDisponibles = exemplairesDuLivre.filter((e) => e.etat === 'DISPONIBLE').length;

  const handleReservation = () => {
    if (!selectedOuvrage || !activeAdherent) return;
    try {
      onReserverOuvrage(selectedOuvrage.id);
      setActionMessage({
        success: true,
        text: `Réservation enregistrée pour « ${selectedOuvrage.titre} ». Vous êtes en file d'attente FIFO.`,
      });
    } catch (err: any) {
      setActionMessage({
        success: false,
        text: err.message,
      });
    }
  };

  // Soumission du formulaire « Ajouter un ouvrage »
  const handleSubmitOuvrage = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newIsbn.trim() || !newTitre.trim() || !newAuteur.trim() || !newCategorie.trim()) {
        throw new Error("Tous les champs (ISBN, titre, auteur, catégorie) sont obligatoires.");
      }
      const created = onAjouterOuvrage({
        isbn: newIsbn,
        titre: newTitre,
        auteur: newAuteur,
        categorie: newCategorie,
      });
      setSelectedOuvrageId((created as any)?.id || null);
      setActionMessage({
        success: true,
        text: `Ouvrage « ${newTitre.trim()} » ajouté avec succès au catalogue.`,
      });
      setNewIsbn('');
      setNewTitre('');
      setNewAuteur('');
      setNewCategorie('');
      setShowAddOuvrage(false);
    } catch (err: any) {
      setActionMessage({
        success: false,
        text: err.message,
      });
    }
  };

  // Soumission du formulaire « Ajouter un exemplaire » (refuse un code-barre déjà utilisé)
  const handleSubmitExemplaire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOuvrage) return;

    const codeNettoye = inputCodeBarre.trim().toUpperCase();
    if (!codeNettoye) {
      setActionMessage({
        success: false,
        text: "Veuillez renseigner un code-barre.",
      });
      return;
    }

    // Refuse un code-barre déjà utilisé
    const dejaPris = exemplaires.some(
      (ex) => ex.code_barre.trim().toUpperCase() === codeNettoye
    );
    if (dejaPris) {
      setActionMessage({
        success: false,
        text: `Refusé : le code-barre « ${codeNettoye} » est déjà utilisé par un autre exemplaire. Le code-barre doit être strictement unique.`,
      });
      return;
    }

    try {
      onAjouterExemplaire(selectedOuvrage.id, codeNettoye);
      setActionMessage({
        success: true,
        text: `Exemplaire « ${codeNettoye} » ajouté avec succès à l'état initial DISPONIBLE.`,
      });
      setInputCodeBarre('');
      setShowAddExemplaire(false);
    } catch (err: any) {
      setActionMessage({
        success: false,
        text: err.message,
      });
    }
  };

  const getBadgeEtat = (etat: EtatExemplaire) => {
    switch (etat) {
      case 'DISPONIBLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EMPRUNTE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_RETARD':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      case 'RESERVE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'PERDU':
        return 'bg-slate-200 text-slate-700 border-slate-400 line-through';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar : search, filters and button Ajouter un ouvrage */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Catalogue & Exemplaires</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez les ouvrages et gérez les exemplaires physiques.
            </p>
          </div>

          <button
            onClick={() => setShowAddOuvrage(!showAddOuvrage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            {showAddOuvrage ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddOuvrage ? 'Fermer le formulaire' : 'Ajouter un ouvrage'}</span>
          </button>
        </div>

        {/* Formulaire « Ajouter un ouvrage » (ISBN, titre, auteur, catégorie) */}
        {showAddOuvrage && (
          <form
            onSubmit={handleSubmitOuvrage}
            className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 animate-in fade-in space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Formulaire : Ajouter un ouvrage
              </h3>
              <span className="text-[11px] text-blue-700">Tous les champs sont requis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ISBN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 978-2070612758"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Titre <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Les Misérables"
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Auteur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Victor Hugo"
                  value={newAuteur}
                  onChange={(e) => setNewAuteur(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catégorie <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roman, Informatique..."
                  value={newCategorie}
                  onChange={(e) => setNewCategorie(e.target.value)}
                  list="categoriesList"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <datalist id="categoriesList">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddOuvrage(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
              >
                Enregistrer l'ouvrage
              </button>
            </div>
          </form>
        )}

        {/* Search and filter row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-1">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Catégorie :</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Trier par :</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="titre">Titre (A-Z)</option>
              <option value="auteur">Auteur</option>
              <option value="annee">Année</option>
            </select>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-lg text-sm border flex items-start gap-3 ${
            actionMessage.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p>{actionMessage.text}</p>
        </div>
      )}

      {/* Main Grid: Book List + Detailed Book View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Book Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{filteredOuvrages.length} ouvrage(s) au catalogue</span>
            <span>Cliquez pour consulter la fiche</span>
          </div>

          {filteredOuvrages.map((ouv) => {
            const exList = exemplaires.filter((e) => e.ouvrage_id === ouv.id);
            const dispo = exList.filter((e) => e.etat === 'DISPONIBLE').length;
            const isSelected = selectedOuvrage?.id === ouv.id;

            return (
              <div
                key={ouv.id}
                onClick={() => {
                  setSelectedOuvrageId(ouv.id);
                  setShowAddExemplaire(false);
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition flex gap-4 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <img
                  src={ouv.couvertureUrl}
                  alt={ouv.titre}
                  className="w-16 h-22 object-cover rounded-md shadow-xs shrink-0 bg-slate-100"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{ouv.titre}</h3>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {ouv.annee}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">{ouv.auteur}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {ouv.categorie}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ISBN: {ouv.isbn}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Exemplaires : <strong className="text-slate-700">{exList.length}</strong>
                    </span>

                    {dispo > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {dispo} disponible{dispo > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                        Tous empruntés / réservés
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Book Sheet & Copies Detail */}
        {selectedOuvrage && (
          <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Fiche Ouvrage & Exemplaires
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedOuvrage.titre}</h2>
              <p className="text-xs text-slate-600 font-medium">{selectedOuvrage.auteur}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {selectedOuvrage.description}
              </p>
            </div>

            {/* Liste des exemplaires */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Exemplaires physiques ({exemplairesDuLivre.length})
                </h3>

                {/* Bouton « Ajouter un exemplaire » */}
                <button
                  onClick={() => {
                    setShowAddExemplaire(!showAddExemplaire);
                    if (!inputCodeBarre) {
                      const codeNum = String(selectedOuvrage.id).padStart(4, '0');
                      const copyNum = String(exemplairesDuLivre.length + 1).padStart(2, '0');
                      setInputCodeBarre(`EX-${codeNum}-${copyNum}`);
                    }
                  }}
                  className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md font-semibold transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un exemplaire</span>
                </button>
              </div>

              {/* Formulaire « Ajouter un exemplaire » (code-barre unique, état initial DISPONIBLE, refuse un code-barre déjà utilisé) */}
              {showAddExemplaire && (
                <form
                  onSubmit={handleSubmitExemplaire}
                  className="p-3.5 mb-3 bg-slate-50 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Nouvel Exemplaire
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      État initial : DISPONIBLE
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Code-barre unique <span className="text-rose-500">*</span> :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: EX-0001-04"
                      value={inputCodeBarre}
                      onChange={(e) => setInputCodeBarre(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono px-3 py-1.5 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Unicité obligatoire : tout code-barre déjà utilisé sera refusé.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddExemplaire(false)}
                      className="px-2.5 py-1 rounded-md border border-slate-300 text-[11px] text-slate-600 hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Confirmer l'ajout (DISPONIBLE)
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {exemplairesDuLivre.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Aucun exemplaire physique pour cet ouvrage. Cliquez sur « Ajouter un exemplaire ».
                  </p>
                ) : (
                  exemplairesDuLivre.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold text-slate-800">{ex.code_barre}</p>
                        <p className="text-[11px] text-slate-500">ID interne : #{ex.id}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getBadgeEtat(
                            ex.etat
                          )}`}
                        >
                          {ex.etat}
                        </span>

                        {/* Action bibliothécaire : déclarer perdu */}
                        {currentRole === 'bibliothecaire' &&
                          (ex.etat === 'EMPRUNTE' || ex.etat === 'EN_RETARD') && (
                            <button
                              type="button"
                              onClick={() => onDeclarerPerdu(ex.id)}
                              title="Déclarer perdu (transition UML autorisée)"
                              className="text-[10px] text-rose-600 hover:text-rose-800 border border-rose-200 bg-rose-50 px-2 py-0.5 rounded"
                            >
                              Perdu ?
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section Réservation Adhérent */}
            {currentRole === 'adherent' && (
              <div className="pt-3 border-t border-slate-100">
                <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-900 font-semibold mb-1">
                    Réservation d'ouvrage (Périmètre Adhérent)
                  </p>
                  <p className="text-[11px] text-amber-800 mb-3">
                    La réservation porte sur l'ouvrage entier. Vous serez notifié dès qu'un
                    exemplaire sera restitué au comptoir (priorité FIFO).
                  </p>

                  <button
                    onClick={handleReservation}
                    disabled={nbDisponibles > 0}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      nbDisponibles > 0
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {nbDisponibles > 0
                        ? 'Exemplaire disponible : passez au comptoir pour emprunter'
                        : 'Réserver cet ouvrage'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
