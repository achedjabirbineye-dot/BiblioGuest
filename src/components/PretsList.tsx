import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Adherent, Bibliothecaire, Exemplaire, Ouvrage, Pret } from '../types';
import { calculerDifferenceJours } from '../services/libraryService';

interface PretsListProps {
  prets: Pret[];
  exemplaires: Exemplaire[];
  ouvrages: Ouvrage[];
  adherents: Adherent[];
  bibliothecaires: Bibliothecaire[];
  currentSimulatedDate: string;
  onRenouvelerPret: (pretId: number) => void;
}

export const PretsList: React.FC<PretsListProps> = ({
  prets,
  exemplaires,
  ouvrages,
  adherents,
  currentSimulatedDate,
  onRenouvelerPret,
}) => {
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredPrets = prets.filter((p) => {
    if (filterStatut === 'all') return true;
    return p.statut === filterStatut;
  });

  const handleRenouveler = (pretId: number) => {
    try {
      onRenouvelerPret(pretId);
      setFeedback('Prêt renouvelé avec succès (+15 jours accordés).');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Erreur : ${err.message}`);
    }
  };

  const nbEnCours = prets.filter((p) => p.statut === 'EN_COURS').length;
  const nbEnRetard = prets.filter((p) => p.statut === 'EN_RETARD').length;
  const nbClotures = prets.filter((p) => p.statut === 'CLOTURE').length;

  return (
    <div className="space-y-6">
      {/* Header and KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prêts en cours (à l'heure)
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">{nbEnCours}</p>
          <p className="text-xs text-slate-400 mt-1">Date de retour non dépassée</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Prêts en Retard
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{nbEnRetard}</p>
          <p className="text-xs text-rose-500 mt-1">Génèrent des pénalités au comptoir</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Historique Clôturés
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-700 mt-2">{nbClotures}</p>
          <p className="text-xs text-slate-400 mt-1">Restitués avec succès</p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Suivi des Emprunts & Délais</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrer par statut :</span>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Tous ({prets.length})</option>
              <option value="EN_COURS">EN_COURS ({nbEnCours})</option>
              <option value="EN_RETARD">EN_RETARD ({nbEnRetard})</option>
              <option value="CLOTURE">CLOTURE ({nbClotures})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Ouvrage & Exemplaire</th>
                <th className="px-4 py-3">Emprunteur</th>
                <th className="px-4 py-3">Date Prêt</th>
                <th className="px-4 py-3">Retour Prévu</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Renouv.</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrets.map((p) => {
                const ex = exemplaires.find((e) => e.id === p.exemplaire_id);
                const ouv = ex ? ouvrages.find((o) => o.id === ex.ouvrage_id) : null;
                const adh = adherents.find((a) => a.id === p.adherent_id);
                const isLate = p.date_retour_prevue < currentSimulatedDate && p.statut !== 'CLOTURE';
                const retardJours = isLate
                  ? calculerDifferenceJours(currentSimulatedDate, p.date_retour_prevue)
                  : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-400">
                      #{p.id}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{ouv?.titre || 'Inconnu'}</p>
                      <p className="font-mono text-[11px] text-slate-500">
                        Code: {ex?.code_barre}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {adh?.prenom} {adh?.nom}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {adh?.numero_carte}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">{p.date_pret}</td>

                    <td className="px-4 py-3">
                      <p className={`font-mono font-medium ${isLate ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {p.date_retour_prevue}
                      </p>
                      {isLate && (
                        <p className="text-[10px] text-rose-500 font-bold">
                          +{retardJours} j de retard ({Math.min(retardJours * 50, 100).toFixed(0)} DH)
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.statut === 'EN_COURS'
                            ? 'bg-blue-100 text-blue-800'
                            : p.statut === 'EN_RETARD'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.statut}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {p.nb_renouvellements} / 1
                    </td>

                    <td className="px-4 py-3 text-right">
                      {p.statut === 'EN_COURS' && p.nb_renouvellements === 0 && !isLate && (
                        <button
                          type="button"
                          onClick={() => handleRenouveler(p.id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded inline-flex items-center gap-1 border border-slate-300"
                        >
                          <RefreshCw className="w-3 h-3 text-blue-600" />
                          <span>Renouveler (+15j)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
