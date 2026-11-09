import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  Mail,
  Printer,
  QrCode,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import { Adherent, Penalite, Pret } from '../types';

interface AdherentsListProps {
  adherents: Adherent[];
  prets: Pret[];
  penalites: Penalite[];
  currentSimulatedDate: string;
  onSelectForPret: (numeroCarte: string) => void;
}

export const AdherentsList: React.FC<AdherentsListProps> = ({
  adherents,
  prets,
  penalites,
  currentSimulatedDate,
  onSelectForPret,
}) => {
  const [selectedAdherent, setSelectedAdherent] = useState<Adherent | null>(adherents[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (selectedAdherent) {
      QRCode.toDataURL(selectedAdherent.numero_carte, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedAdherent]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                Gestion des Adhérents & Cartes
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Répertoire des Adhérents & Cartes avec QR Code
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Génération automatique du QR Code contenant la valeur unique du numéro de carte (ex: <code>ETU-2024-0001</code>).
              Imprimable pour les usagers de la bibliothèque.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des adhérents */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Liste des 5 adhérents (Jeu d'essai Section 14)</span>
            <span className="text-xs text-slate-400 font-normal">Cliquez pour voir la carte</span>
          </h2>

          <div className="space-y-3">
            {adherents.map((adh) => {
              const isSelected = selectedAdherent?.id === adh.id;
              const isExpired = adh.date_fin_abonnement < currentSimulatedDate;
              const empruntsActifs = prets.filter(
                (p) =>
                  p.adherent_id === adh.id &&
                  (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
              ).length;
              const penaliteImpayee = penalites.find(
                (p) => p.adherent_id === adh.id && !p.est_payee
              );

              return (
                <div
                  key={adh.id}
                  onClick={() => setSelectedAdherent(adh)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isExpired
                          ? 'bg-rose-100 text-rose-700'
                          : penaliteImpayee
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {adh.prenom.charAt(0)}
                      {adh.nom.charAt(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {adh.prenom} {adh.nom}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {adh.numero_carte}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {adh.email}
                        </span>
                        <span>•</span>
                        <span>Abonnement : {adh.date_fin_abonnement}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de statut */}
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Abonnement expiré
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Actif
                      </span>
                    )}

                    {penaliteImpayee && (
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                        Pénalité : {penaliteImpayee.montant.toFixed(0)} DH
                      </span>
                    )}

                    <span className="text-slate-400">
                      {empruntsActifs} prêt(s) en cours
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aperçu de la carte adhérent imprimable */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Carte de Lecteur Officielle
            </h2>
            <button
              onClick={handlePrint}
              className="text-xs flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
          </div>

          {selectedAdherent && (
            <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-blue-500/30 relative overflow-hidden">
              {/* Effet décoratif */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
                    Bibliothèque Universitaire
                  </p>
                  <p className="text-base font-extrabold tracking-tight">CARTE DE LECTEUR</p>
                </div>
                <div className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[10px] font-mono">
                  {selectedAdherent.statut.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-4 my-3">
                {/* QR Code rendu */}
                <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${selectedAdherent.numero_carte}`}
                      className="w-24 h-24"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-400 text-[10px]">Titulaire :</p>
                  <p className="font-bold text-sm text-white">
                    {selectedAdherent.prenom} {selectedAdherent.nom}
                  </p>
                  <p className="font-mono text-blue-300 text-xs font-semibold">
                    {selectedAdherent.numero_carte}
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Valide jusqu'au :
                  </p>
                  <p
                    className={`font-semibold text-xs ${
                      selectedAdherent.date_fin_abonnement < currentSimulatedDate
                        ? 'text-rose-400 font-bold'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedAdherent.date_fin_abonnement}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-700/80 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-400">
                <span>TP OMDL • UML Conforme</span>
                <span className="font-mono">{selectedAdherent.email}</span>
              </div>
            </div>
          )}

          {selectedAdherent && (
            <div className="mt-4 w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onSelectForPret(selectedAdherent.numero_carte)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
              >
                <QrCode className="w-4 h-4" />
                <span>Simuler le scan au comptoir de prêt</span>
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                La valeur scannée correspond au numéro de carte : <strong className="font-mono">{selectedAdherent.numero_carte}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
