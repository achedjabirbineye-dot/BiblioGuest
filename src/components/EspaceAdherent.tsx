import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Layers,
  Mail,
  QrCode,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Adherent, Exemplaire, Ouvrage, Penalite, Pret, Reservation } from '../types';
import { calculerDifferenceJours } from '../services/libraryService';

interface EspaceAdherentProps {
  adherent: Adherent;
  ouvrages: Ouvrage[];
  exemplaires: Exemplaire[];
  prets: Pret[];
  reservations: Reservation[];
  penalites: Penalite[];
  currentSimulatedDate: string;
  onNavigateToCatalogue: () => void;
  onAnnulerReservation: (reservationId: number) => void;
}

export const EspaceAdherent: React.FC<EspaceAdherentProps> = ({
  adherent,
  ouvrages,
  exemplaires,
  prets,
  reservations,
  penalites,
  currentSimulatedDate,
  onNavigateToCatalogue,
  onAnnulerReservation,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(adherent.numero_carte, { width: 180, margin: 2 })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [adherent.numero_carte]);

  const mesPrets = prets.filter((p) => p.adherent_id === adherent.id);
  const mesPretsActifs = mesPrets.filter(
    (p) => p.statut === 'EN_COURS' || p.statut === 'EN_RETARD'
  );
  const monHistorique = mesPrets.filter((p) => p.statut === 'CLOTURE');
  const mesReservations = reservations.filter((r) => r.adherent_id === adherent.id);
  const mesPenalites = penalites.filter((p) => p.adherent_id === adherent.id);
  const penaliteImpayee = mesPenalites.find((p) => !p.est_payee);

  const isExpired = adherent.date_fin_abonnement < currentSimulatedDate;

  return (
    <div className="space-y-6">
      {/* Banner adhérent */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-emerald-500/20 shrink-0">
              {adherent.prenom.charAt(0)}{adherent.nom.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Espace Lecteur Personnel
                </span>
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {adherent.numero_carte}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {adherent.prenom} {adherent.nom}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <span>{adherent.email}</span>
                <span>•</span>
                <span>
                  Fin d'abonnement :{' '}
                  <strong className={isExpired ? 'text-rose-600' : 'text-slate-700'}>
                    {adherent.date_fin_abonnement}
                  </strong>
                </span>
              </p>
            </div>
          </div>

          {/* Quick status badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {isExpired ? (
              <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center gap-1.5 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
                <span>Abonnement expiré</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Abonnement en règle</span>
              </span>
            )}

            {penaliteImpayee && (
              <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center gap-1.5 border border-amber-200">
                <ShieldAlert className="w-4 h-4" />
                <span>Pénalité due : {penaliteImpayee.montant.toFixed(0)} DH</span>
              </span>
            )}
          </div>
        </div>

        {/* Note sur le périmètre limité de l'adhérent (Section 3 du prompt) */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Périmètre de l'adhérent (Section 3) :</strong> Vous pouvez rechercher des ouvrages,
            consulter votre carte QR, réserver des ouvrages indisponibles et suivre vos prêts.
            <strong className="text-slate-800"> L'adhérent ne peut jamais créer un prêt ni enregistrer un retour en ligne</strong> :
            ces opérations se font au guichet physique auprès du bibliothécaire.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mes prêts et réservations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prêts en cours */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Mes Emprunts en Cours ({mesPretsActifs.length} / 3)</span>
              <span className="text-xs text-slate-400 font-normal">Quota max : 3</span>
            </h2>

            {mesPretsActifs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">
                Vous n'avez aucun livre emprunté en ce moment.
              </p>
            ) : (
              <div className="space-y-3">
                {mesPretsActifs.map((p) => {
                  const ex = exemplaires.find((e) => e.id === p.exemplaire_id);
                  const ouv = ex ? ouvrages.find((o) => o.id === ex.ouvrage_id) : null;
                  const isLate = p.date_retour_prevue < currentSimulatedDate;
                  const retardJours = isLate
                    ? calculerDifferenceJours(currentSimulatedDate, p.date_retour_prevue)
                    : 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-lg border text-xs ${
                        isLate
                          ? 'border-rose-300 bg-rose-50/40'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{ouv?.titre}</p>
                          <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                            Exemplaire : {ex?.code_barre} • Emprunté le : {p.date_pret}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLate
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.statut}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                        <span className="text-slate-600">
                          Date limite de retour :{' '}
                          <strong className={isLate ? 'text-rose-600' : 'text-slate-800'}>
                            {p.date_retour_prevue}
                          </strong>
                        </span>

                        {isLate && (
                          <span className="text-rose-600 font-bold">
                            ⚠️ +{retardJours} jours de retard (Pénalité estimée :{' '}
                            {Math.min(retardJours * 50, 100).toFixed(0)} DH)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mes réservations */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Mes Réservations ({mesReservations.length})
              </h2>
              <button
                onClick={onNavigateToCatalogue}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Explorer le catalogue pour réserver →
              </button>
            </div>

            {mesReservations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune réservation active.
              </p>
            ) : (
              <div className="space-y-2">
                {mesReservations.map((r) => {
                  const ouv = ouvrages.find((o) => o.id === r.ouvrage_id);
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{ouv?.titre}</p>
                        <p className="text-[11px] text-slate-500">
                          Réservé le : {new Date(r.date_reservation).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.statut === 'EN_ATTENTE'
                              ? 'bg-amber-100 text-amber-800'
                              : r.statut === 'DISPONIBLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.statut}
                        </span>

                        {(r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE') && (
                          <button
                            type="button"
                            onClick={() => onAnnulerReservation(r.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mes pénalités */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Mes Pénalités ({mesPenalites.length})
            </h2>

            {mesPenalites.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune pénalité enregistrée. Vous êtes en règle !
              </p>
            ) : (
              <div className="space-y-2">
                {mesPenalites.map((pen) => (
                  <div
                    key={pen.id}
                    className={`p-3 rounded-lg border text-xs flex justify-between items-center ${
                      pen.est_payee
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-rose-200 bg-rose-50/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{pen.motif}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Montant : <strong>{pen.montant.toFixed(0)} DH</strong>
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pen.est_payee
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pen.est_payee ? 'RÉGLÉE' : 'À PAYER AU GUICHET'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ma Carte Virtuelle QR */}
        <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Ma Carte Virtuelle de Lecteur
          </h2>

          <div className="w-full bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 text-center relative overflow-hidden">
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">
              Bibliothèque Universitaire
            </p>
            <h3 className="font-bold text-sm">{adherent.prenom} {adherent.nom}</h3>
            <p className="font-mono text-xs text-slate-400 mt-0.5">{adherent.numero_carte}</p>

            <div className="bg-white p-2 rounded-xl my-4 inline-block shadow">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-slate-200 animate-pulse" />
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              Présentez ce QR Code au comptoir du bibliothécaire pour emprunter ou restituer vos livres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
