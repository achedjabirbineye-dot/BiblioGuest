import React, { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Adherent, Ouvrage, Penalite, Reservation } from '../types';

interface ReservationsPenalitesListProps {
  reservations: Reservation[];
  penalites: Penalite[];
  adherents: Adherent[];
  ouvrages: Ouvrage[];
  currentRole: 'bibliothecaire' | 'adherent';
  activeAdherent?: Adherent;
  onAnnulerReservation: (reservationId: number) => void;
  onReglerPenalite: (penaliteId: number) => void;
  onCreerPenaliteManuelle: (
    adherentId: number,
    montant: number,
    motif: string
  ) => void;
}

export const ReservationsPenalitesList: React.FC<ReservationsPenalitesListProps> = ({
  reservations,
  penalites,
  adherents,
  ouvrages,
  currentRole,
  activeAdherent,
  onAnnulerReservation,
  onReglerPenalite,
  onCreerPenaliteManuelle,
}) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'penalites'>('reservations');
  const [modalNewPenalite, setModalNewPenalite] = useState(false);
  const [targetAdherentId, setTargetAdherentId] = useState<number>(adherents[0].id);
  const [nouveauMontant, setNouveauMontant] = useState<number>(10);
  const [nouveauMotif, setNouveauMotif] = useState<string>('Dégradation de couverture');

  const handleCreatePenalite = (e: React.FormEvent) => {
    e.preventDefault();
    onCreerPenaliteManuelle(targetAdherentId, nouveauMontant, nouveauMotif);
    setModalNewPenalite(false);
  };

  const handleRegler = (penaliteId: number) => {
    onReglerPenalite(penaliteId);
    confetti({ particleCount: 30, spread: 45 });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'reservations'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Réservations d'Ouvrages (File FIFO)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {reservations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('penalites')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'penalites'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Pénalités & Recouvrements</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {penalites.length}
          </span>
        </button>
      </div>

      {/* Content: Reservations */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                File d'Attente des Réservations (FIFO)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Une seule réservation active par adhérent et par ouvrage. Validité de retrait : 7 jours une fois disponible.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Ouvrage visé</th>
                  <th className="px-4 py-3">Adhérent</th>
                  <th className="px-4 py-3">Date Réservation</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Expiration retrait</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      Aucune réservation enregistrée.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r) => {
                    const ouv = ouvrages.find((o) => o.id === r.ouvrage_id);
                    const adh = adherents.find((a) => a.id === r.adherent_id);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-slate-400">#{r.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{ouv?.titre}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {adh?.prenom} {adh?.nom}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {adh?.numero_carte}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {new Date(r.date_reservation).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.statut === 'EN_ATTENTE'
                                ? 'bg-amber-100 text-amber-800'
                                : r.statut === 'DISPONIBLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.statut === 'HONOREE'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {r.date_expiration_retrait || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE') && (
                            <button
                              type="button"
                              onClick={() => onAnnulerReservation(r.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1 border border-rose-200 bg-rose-50 px-2 py-1 rounded"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Annuler</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content: Penalties */}
      {activeTab === 'penalites' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Registre des Pénalités (Section 5)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Retards (50 DH / j, max 100 DH), pertes ou dégradations. Un adhérent avec pénalité impayée est bloqué pour tout nouvel emprunt.
              </p>
            </div>

            {currentRole === 'bibliothecaire' && (
              <button
                onClick={() => setModalNewPenalite(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Déclarer pénalité manuelle</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Adhérent</th>
                  <th className="px-4 py-3">Motif</th>
                  <th className="px-4 py-3">Date création</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">État paiement</th>
                  <th className="px-4 py-3 text-right">Règlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penalites.map((pen) => {
                  const adh = adherents.find((a) => a.id === pen.adherent_id);

                  return (
                    <tr key={pen.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-slate-400">#{pen.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {adh?.prenom} {adh?.nom}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {adh?.numero_carte}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{pen.motif}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(pen.date_creation).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                        {pen.montant.toFixed(0)} DH
                      </td>
                      <td className="px-4 py-3">
                        {pen.est_payee ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Réglée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Impayée (Bloquant)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!pen.est_payee && currentRole === 'bibliothecaire' && (
                          <button
                            type="button"
                            onClick={() => handleRegler(pen.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded inline-flex items-center gap-1 shadow-xs"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Encaisser & Régulariser</span>
                          </button>
                        )}
                        {pen.est_payee && (
                          <span className="text-[11px] text-slate-400 italic">
                            Réglée le {pen.date_reglement ? new Date(pen.date_reglement).toLocaleDateString() : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale de création manuelle de pénalité */}
      {modalNewPenalite && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-lg text-slate-800 mb-3">
              Enregistrer une pénalité (Perte ou Dégradation)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pour une perte ou une dégradation, le montant est saisi manuellement par le bibliothécaire (Section 5).
            </p>

            <form onSubmit={handleCreatePenalite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adhérent concerné :
                </label>
                <select
                  value={targetAdherentId}
                  onChange={(e) => setTargetAdherentId(parseInt(e.target.value, 10))}
                  className="w-full text-xs px-3 py-2 border rounded-lg border-slate-300"
                >
                  {adherents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.prenom} {a.nom} ({a.numero_carte})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant de la pénalité (DH) :
                </label>
                <input
                  type="number"
                  step="10"
                  min="10"
                  value={nouveauMontant}
                  onChange={(e) => setNouveauMontant(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 border rounded-lg border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif précis (obligatoire) :
                </label>
                <input
                  type="text"
                  value={nouveauMotif}
                  onChange={(e) => setNouveauMotif(e.target.value)}
                  placeholder="Ex: Dégradation de reliure / Perte d'ouvrage"
                  className="w-full text-xs px-3 py-2 border rounded-lg border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow"
                >
                  Valider et enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setModalNewPenalite(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
