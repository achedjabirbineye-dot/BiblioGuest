import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { TRANSITIONS_AUTORISEES } from '../services/libraryService';

export const UmlDiagramsView: React.FC = () => {
  const [activeDiagram, setActiveDiagram] = useState<'classes' | 'etats' | 'activites' | 'temps'>('classes');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                Spécifications Logicielles Formelles
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Les 4 Diagrammes UML Validés & Matrice de Conformité
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Architecture validée pour le TP « Outils et méthodes de développement logiciel ».
              Priorité absolue aux diagrammes pour toute décision d'implémentation.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs sm:text-sm">
          <button
            onClick={() => setActiveDiagram('classes')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeDiagram === 'classes'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Diagramme de Classes (7 classes)</span>
          </button>

          <button
            onClick={() => setActiveDiagram('etats')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeDiagram === 'etats'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>2. Diagramme d'États (Exemplaire)</span>
          </button>

          <button
            onClick={() => setActiveDiagram('activites')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeDiagram === 'activites'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>3. Diagramme d'Activités (Comptoir)</span>
          </button>

          <button
            onClick={() => setActiveDiagram('temps')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeDiagram === 'temps'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>4. Diagramme de Temps (01/10-05/12)</span>
          </button>
        </div>
      </div>

      {/* DIAGRAMME 1 : Classes */}
      {activeDiagram === 'classes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-2">
              Diagramme de Classes UML (7 Classes Stricte, Associations Simples)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Aucun héritage, aucune composition ni agrégation complexe. Clés étrangères avec ON DELETE RESTRICT.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {/* Adherent */}
              <div className="border-2 border-blue-500 rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-blue-600 text-white p-2 font-bold text-center font-sans">
                  Adherent
                </div>
                <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                  <p>+ id: Integer [PK]</p>
                  <p className="font-bold text-blue-700">+ numero_carte: String [Unique, QR]</p>
                  <p>+ nom: String</p>
                  <p>+ prenom: String</p>
                  <p>+ email: String [Unique]</p>
                  <p>+ date_fin_abonnement: Date</p>
                  <p>+ statut: String (actif/suspendu/inactif)</p>
                </div>
                <div className="p-3 bg-white space-y-1 text-blue-900 font-bold">
                  <p>+ emprunter(exemplaire): Pret</p>
                  <p>+ reserver(ouvrage): Reservation</p>
                </div>
              </div>

              {/* Bibliothecaire */}
              <div className="border-2 border-indigo-500 rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-indigo-600 text-white p-2 font-bold text-center font-sans">
                  Bibliothecaire
                </div>
                <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                  <p>+ id: Integer [PK]</p>
                  <p className="font-bold text-indigo-700">+ matricule: String [Unique]</p>
                  <p>+ nom: String</p>
                  <p>+ prenom: String</p>
                  <p>+ email: String [Unique]</p>
                </div>
                <div className="p-3 bg-white space-y-1 text-indigo-900 font-bold">
                  <p>+ enregistrer_pret()</p>
                  <p>+ enregistrer_retour()</p>
                  <p>+ enregistrer_penalite()</p>
                </div>
              </div>

              {/* Ouvrage */}
              <div className="border-2 border-emerald-500 rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-emerald-600 text-white p-2 font-bold text-center font-sans">
                  Ouvrage
                </div>
                <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                  <p>+ id: Integer [PK]</p>
                  <p>+ isbn: String [Unique]</p>
                  <p>+ titre: String</p>
                  <p className="font-bold text-emerald-800">+ auteur: String</p>
                  <p className="font-bold text-emerald-800">+ categorie: String</p>
                  <p>+ annee: Integer</p>
                  <p>+ editeur: String</p>
                </div>
                <div className="p-3 bg-white text-slate-400 italic">
                  <span>(Entité visée par Reservation)</span>
                </div>
              </div>

              {/* Exemplaire */}
              <div className="border-2 border-amber-500 rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-amber-600 text-white p-2 font-bold text-center font-sans">
                  Exemplaire
                </div>
                <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                  <p>+ id: Integer [PK]</p>
                  <p className="font-bold text-amber-800">+ code_barre: String [Unique]</p>
                  <p>+ ouvrage_id: Integer [FK]</p>
                  <p className="font-bold text-amber-800">
                    + etat: Enum (DISPONIBLE, EMPRUNTE, EN_RETARD, RESERVE, PERDU)
                  </p>
                </div>
                <div className="p-3 bg-white space-y-1 text-amber-900 font-bold">
                  <p>+ est_disponible(): Boolean</p>
                </div>
              </div>

              {/* Pret */}
              <div className="border-2 border-rose-500 rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-rose-600 text-white p-2 font-bold text-center font-sans">
                  Pret
                </div>
                <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                  <p>+ id: Integer [PK]</p>
                  <p>+ date_pret: Date</p>
                  <p>+ date_retour_prevue: Date (J+15)</p>
                  <p>+ date_retour_effective: Date (nullable)</p>
                  <p>+ nb_renouvellements: Integer (Max 1)</p>
                  <p>+ statut: Enum (EN_COURS, EN_RETARD, CLOTURE, PERDU)</p>
                  <p>+ adherent_id: Integer [FK]</p>
                  <p>+ exemplaire_id: Integer [FK]</p>
                  <p className="font-bold text-rose-800">+ bibliothecaire_id: Integer [FK]</p>
                </div>
                <div className="p-3 bg-white space-y-1 text-rose-900 font-bold">
                  <p>+ renouveler()</p>
                  <p>+ est_en_retard(): Boolean</p>
                </div>
              </div>

              {/* Reservation & Penalite */}
              <div className="border-2 border-purple-500 rounded-lg overflow-hidden bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="bg-purple-600 text-white p-2 font-bold text-center font-sans">
                    Reservation & Penalite
                  </div>
                  <div className="p-3 border-b border-slate-200 space-y-1 text-slate-700">
                    <p className="font-bold text-purple-700">[Reservation]</p>
                    <p>+ date_reservation: DateTime (FIFO)</p>
                    <p>+ statut: EN_ATTENTE/DISPONIBLE/HONOREE/EXPIREE/ANNULEE</p>
                    <p>+ annuler()</p>
                  </div>
                  <div className="p-3 space-y-1 text-slate-700">
                    <p className="font-bold text-purple-700">[Penalite (0..1 de Pret)]</p>
                    <p>+ montant: Decimal (50 DH/j, max 100 DH)</p>
                    <p>+ est_payee: Boolean</p>
                    <p>+ motif: String</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIAGRAMME 2 : États de l'Exemplaire */}
      {activeDiagram === 'etats' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Diagramme d'États-Transitions de l'Exemplaire (Section 8)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                5 états stricts : <strong>DISPONIBLE, EMPRUNTE, EN_RETARD, RESERVE, PERDU</strong> (final).
                Aucun état INDISPONIBLE.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">État Source (De)</th>
                  <th className="px-4 py-3">État Cible (Vers)</th>
                  <th className="px-4 py-3">Événement déclencheur</th>
                  <th className="px-4 py-3">Conformité Service Métier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {TRANSITIONS_AUTORISEES.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{t.from}</td>
                    <td className="px-4 py-2.5 font-bold text-blue-700 flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.to}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-sans">{t.evenement}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Validé & Testé
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIAGRAMME 3 : Activités */}
      {activeDiagram === 'activites' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            Diagramme d'Activités : Emprunter et Retourner au Comptoir (Section 9)
          </h2>
          <p className="text-xs text-slate-500">
            Structure en 3 couloirs stricts. L'adhérent ne fait aucune demande en ligne : tout se déroule au guichet physique.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
              <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-3">
                Couloir 1 : Adhérent
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Se présente au comptoir avec sa carte (QR Code) et le livre.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">7</span>
                  <span>Reçoit le livre après validation du prêt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">8</span>
                  <span>Rapporte l'exemplaire au comptoir pour restitution.</span>
                </li>
              </ul>
            </div>

            <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/30">
              <h3 className="font-bold text-indigo-900 border-b border-indigo-200 pb-2 mb-3">
                Couloir 2 : Bibliothécaire
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Saisit ou scanne le numéro de carte et le code-barre.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px]">5</span>
                  <span>Exécute <code>enregistrer_pret()</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px]">9b</span>
                  <span>En cas de retard : valide <code>enregistrer_penalite()</code>.</span>
                </li>
              </ul>
            </div>

            <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
              <h3 className="font-bold text-emerald-900 border-b border-emerald-200 pb-2 mb-3">
                Couloir 3 : Système
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Vérifie abonnement valide & compte actif (sinon refus).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                  <span>Vérifie exemplaire disponible (sinon refus).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">6</span>
                  <span>Exemplaire passe à EMPRUNTE. Échéance à J+15.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">10</span>
                  <span>Au retour : passe à DISPONIBLE (ou RESERVE si file FIFO).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DIAGRAMME 4 : Temps */}
      {activeDiagram === 'temps' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            Diagramme de Temps : Chronologie de Référence (Section 10)
          </h2>
          <p className="text-xs text-slate-500">
            Rejouable intégralement dans l'onglet dédié « Rejeu Scénario Temps » et validé par test pytest.
          </p>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3">Période</th>
                  <th className="px-4 py-3">État Exemplaire</th>
                  <th className="px-4 py-3">Événement déclencheur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr><td className="px-4 py-2">01/10 → 06/10</td><td className="font-bold text-emerald-600">DISPONIBLE</td><td className="font-sans">Ajout au catalogue</td></tr>
                <tr><td className="px-4 py-2">06/10 → 21/10</td><td className="font-bold text-blue-600">EMPRUNTE</td><td className="font-sans">enregistrer_pret() (15 jours)</td></tr>
                <tr><td className="px-4 py-2">21/10 → 27/10</td><td className="font-bold text-rose-600">EN_RETARD</td><td className="font-sans">Date dépassée (système)</td></tr>
                <tr><td className="px-4 py-2">27/10 → 29/10</td><td className="font-bold text-emerald-600">DISPONIBLE</td><td className="font-sans">Retour + enregistrer_penalite() (100 DH)</td></tr>
                <tr><td className="px-4 py-2">29/10 → 13/11</td><td className="font-bold text-blue-600">EMPRUNTE</td><td className="font-sans">enregistrer_pret()</td></tr>
                <tr><td className="px-4 py-2">13/11 → 16/11</td><td className="font-bold text-amber-600">RESERVE</td><td className="font-sans">Retour avec réservation en attente</td></tr>
                <tr><td className="px-4 py-2">16/11 → 01/12</td><td className="font-bold text-blue-600">EMPRUNTE</td><td className="font-sans">enregistrer_pret() au réservataire</td></tr>
                <tr><td className="px-4 py-2">01/12 → 05/12</td><td className="font-bold text-emerald-600">DISPONIBLE</td><td className="font-sans">enregistrer_retour()</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
