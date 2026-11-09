import React from 'react';
import {
  BookOpen,
  Calendar,
  Code2,
  FileText,
  History,
  Layers,
  LogOut,
  QrCode,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { Adherent, Bibliothecaire } from '../types';

export type ActiveTab =
  | 'comptoir_pret'
  | 'comptoir_retour'
  | 'catalogue'
  | 'adherents'
  | 'prets'
  | 'reservations_penalites'
  | 'scenario_temps'
  | 'diagrammes_uml'
  | 'code_flask'
  | 'espace_adherent';

interface NavbarProps {
  currentRole: 'bibliothecaire' | 'adherent';
  onSwitchRole: (role: 'bibliothecaire' | 'adherent', adherentId?: number) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  bibliothecaire: Bibliothecaire;
  adherents: Adherent[];
  activeAdherent: Adherent;
  currentSimulatedDate: string;
  onChangeSimulatedDate: (newDate: string) => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  activeTab,
  onSelectTab,
  bibliothecaire,
  adherents,
  activeAdherent,
  currentSimulatedDate,
  onChangeSimulatedDate,
  onResetData,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-50">
      {/* Top Banner : Application name, Date simulation, Active session */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-base flex items-center gap-2">
              <span>BiblioGest</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                UML 4-Diagrammes Conforme
              </span>
            </div>
            <p className="text-xs text-slate-400">TP Outils et Méthodes de Développement Logiciel</p>
          </div>
        </div>

        {/* Date Simulation Bar */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">Date simulée :</span>
          <input
            type="date"
            value={currentSimulatedDate}
            onChange={(e) => onChangeSimulatedDate(e.target.value)}
            className="bg-slate-900 text-amber-300 text-xs px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-amber-400 font-mono font-semibold"
          />
        </div>

        {/* User Session & Role switcher */}
        <div className="flex items-center gap-3">
          {currentRole === 'bibliothecaire' ? (
            <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <div className="text-xs">
                <span className="font-semibold text-blue-200">{bibliothecaire.prenom} {bibliothecaire.nom}</span>
                <span className="text-blue-400 ml-1.5 font-mono">({bibliothecaire.matricule})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/40 px-3 py-1.5 rounded-lg">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-200">{activeAdherent.prenom} {activeAdherent.nom}</span>
                <span className="text-emerald-400 ml-1.5 font-mono">({activeAdherent.numero_carte})</span>
              </div>
            </div>
          )}

          {/* Quick switcher select */}
          <select
            value={currentRole === 'bibliothecaire' ? 'biblio' : `adh_${activeAdherent.id}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'biblio') {
                onSwitchRole('bibliothecaire');
              } else {
                const id = parseInt(val.replace('adh_', ''), 10);
                onSwitchRole('adherent', id);
              }
            }}
            className="bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-400"
          >
            <option value="biblio">👨‍💼 Bibliothécaire ({bibliothecaire.matricule})</option>
            <optgroup label="Changer d'Adhérent (Lecteur)">
              {adherents.map((a) => (
                <option key={a.id} value={`adh_${a.id}`}>
                  👤 {a.prenom} {a.nom} ({a.numero_carte}) {a.date_fin_abonnement < currentSimulatedDate ? '⚠️ Expiré' : ''}
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={onResetData}
            title="Réinitialiser les données de démo"
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-medium">
          {currentRole === 'bibliothecaire' ? (
            <>
              <button
                onClick={() => onSelectTab('comptoir_pret')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'comptoir_pret'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Comptoir Prêt</span>
              </button>

              <button
                onClick={() => onSelectTab('comptoir_retour')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'comptoir_retour'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>2. Comptoir Retour</span>
              </button>

              <button
                onClick={() => onSelectTab('catalogue')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'catalogue'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Catalogue & Exemplaires</span>
              </button>

              <button
                onClick={() => onSelectTab('adherents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'adherents'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Adhérents & Cartes QR</span>
              </button>

              <button
                onClick={() => onSelectTab('prets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'prets'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Prêts & Retards</span>
              </button>

              <button
                onClick={() => onSelectTab('reservations_penalites')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'reservations_penalites'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Réservations & Pénalités</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('espace_adherent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'espace_adherent'
                    ? 'bg-emerald-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Mon Espace Adhérent</span>
              </button>

              <button
                onClick={() => onSelectTab('catalogue')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'catalogue'
                    ? 'bg-emerald-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Catalogue & Réservations</span>
              </button>
            </>
          )}

          {/* Common UML & TP Tabs */}
          <div className="h-5 w-[1px] bg-slate-700 self-center mx-1" />

          <button
            onClick={() => onSelectTab('scenario_temps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
              activeTab === 'scenario_temps'
                ? 'bg-amber-600 text-white font-semibold shadow'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Rejeu Scénario Temps (01/10-05/12)</span>
          </button>

          <button
            onClick={() => onSelectTab('diagrammes_uml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
              activeTab === 'diagrammes_uml'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-indigo-300 hover:text-indigo-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>4 Diagrammes UML</span>
          </button>

          <button
            onClick={() => onSelectTab('code_flask')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition ${
              activeTab === 'code_flask'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-purple-300 hover:text-purple-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Code Flask & Pytest (TP)</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
