import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CameraScannerModal, ScannerMode } from './CameraScannerModal';
import {
  Adherent,
  Bibliothecaire,
  Exemplaire,
  Ouvrage,
  Penalite,
  Pret,
  Reservation,
} from '../types';
import {
  ajouterJours,
  verifierEligibilitePret,
} from '../services/libraryService';

interface ComptoirPretProps {
  bibliothecaire: Bibliothecaire;
  adherents: Adherent[];
  ouvrages: Ouvrage[];
  exemplaires: Exemplaire[];
  prets: Pret[];
  penalites: Penalite[];
  reservations: Reservation[];
  currentSimulatedDate: string;
  onEnregistrerPret: (adherentId: number, exemplaireId: number) => void;
}

export const ComptoirPret: React.FC<ComptoirPretProps> = ({
  bibliothecaire,
  adherents,
  ouvrages,
  exemplaires,
  prets,
  penalites,
  reservations,
  currentSimulatedDate,
  onEnregistrerPret,
}) => {
  const [numeroCarte, setNumeroCarte] = useState<string>('ETU-2025-0001');
  const [codeBarre, setCodeBarre] = useState<string>('EX-0001-01');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    pretId?: number;
  } | null>(null);

  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    type: 'carte' | 'exemplaire';
    title: string;
    initialMode?: ScannerMode;
  } | null>(null);

  // Évaluation en temps réel des règles métiers (les 4 contrôles)
  const audit = verifierEligibilitePret(
    numeroCarte,
    codeBarre,
    adherents,
    exemplaires,
    ouvrages,
    prets,
    penalites,
    reservations,
    currentSimulatedDate
  );

  const handleSubmitPret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audit.valide || !audit.adherent || !audit.exemplaire) {
      setLastResult({
        success: false,
        message: audit.erreur || 'Conditions de prêt non satisfaites.',
      });
      return;
    }

    try {
      onEnregistrerPret(audit.adherent.id, audit.exemplaire.id);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      setLastResult({
        success: true,
        message: `Prêt enregistré avec succès par ${bibliothecaire.prenom} ${bibliothecaire.nom}. Date de retour prévue : ${ajouterJours(
          currentSimulatedDate,
          15
        )} (15 jours).`,
      });
    } catch (err: any) {
      setLastResult({
        success: false,
        message: err.message || 'Erreur lors de l’enregistrement du prêt.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Activity Diagram reminder */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                Diagramme d'activités (Section 9)
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Comptoir d'Emprunt (Guichet Bibliothécaire)
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Les prêts sont enregistrés exclusivement au comptoir par le bibliothécaire (
              <span className="font-semibold text-slate-700">{bibliothecaire.prenom} {bibliothecaire.nom} - {bibliothecaire.matricule}</span>
              ). L'adhérent présente sa carte (QR code) et son exemplaire.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Date d'emprunt : <strong>{currentSimulatedDate}</strong></span>
          </div>
        </div>

        {/* 3 Couloirs du Diagramme d'activités (Adhérent / Bibliothécaire / Système) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Couloir Adhérent</span>
            </div>
            <p className="text-slate-600">
              Présente sa carte physique/virtuelle (QR Code) et le volume physique au comptoir.
            </p>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Couloir Bibliothécaire</span>
            </div>
            <p className="text-blue-800">
              Scanne/saisit le numéro de carte et le code-barre, puis exécute <code className="bg-blue-100 px-1 py-0.5 rounded">enregistrer_pret()</code>.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>3. Couloir Système</span>
            </div>
            <p className="text-emerald-800">
              Vérifie les 4 règles, passe l'exemplaire à <strong className="font-semibold">EMPRUNTE</strong> et fixe le retour à J+15.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form and Live Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>Saisie au comptoir</span>
            <span className="text-xs font-normal text-slate-400">
              (Lecture QR / Douchette ou Saisie manuelle de repli)
            </span>
          </h2>

          <form onSubmit={handleSubmitPret} className="space-y-4">
            {/* Bannière Plan de secours actif */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Plan de secours actif (Sections 2 & 9) :</strong> Caméra indisponible ? Utilisez le bouton « Plan de secours », la douchette virtuelle ou la saisie manuelle.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 shrink-0">
                Repli garanti
              </span>
            </div>

            {/* Numéro de carte adhérent */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Numéro de carte adhérent (contenu du QR Code) :</span>
                </label>
                <span className="text-[11px] text-slate-400">Ex: ETU-2025-0001</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={numeroCarte}
                  onChange={(e) => setNumeroCarte(e.target.value.toUpperCase())}
                  placeholder="ETU-2025-XXXX"
                  className="flex-1 font-mono text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'carte',
                      title: 'Scanner la carte adhérent (Caméra)',
                      initialMode: 'camera',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Utiliser la caméra / webcam pour scanner le QR Code de la carte"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Scanner avec la caméra</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'carte',
                      title: 'Scanner la carte adhérent (Import de fichier depuis l’ordinateur)',
                      initialMode: 'fichier',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Importer une image de QR Code (PNG, JPG, WEBP) depuis l'ordinateur"
                >
                  <Upload className="w-4 h-4 text-violet-600" />
                  <span>Importer un fichier</span>
                </button>
              </div>

              {/* Message d'erreur obligatoire Section 7 si carte non reconnue */}
              {numeroCarte.trim() && !adherents.some(a => a.numero_carte.toUpperCase() === numeroCarte.trim().toUpperCase()) && (
                <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold">Carte non reconnue. Vérifiez auprès de l’administration.</span>
                </div>
              )}

              {/* Raccourcis de test TP pour l'adhérent */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400">Sélection rapide TP :</span>
                {adherents.map((a) => {
                  const isExpired = a.date_fin_abonnement < currentSimulatedDate;
                  const hasPenalty = penalites.some(p => p.adherent_id === a.id && !p.est_payee);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setNumeroCarte(a.numero_carte)}
                      className={`text-xs px-2 py-0.5 rounded border transition cursor-pointer ${
                        numeroCarte === a.numero_carte
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {a.numero_carte} ({a.prenom}) {isExpired ? '⚠️ Expiré' : ''} {hasPenalty ? '💰 Pénalité' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code-barre exemplaire */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Code-barre de l'exemplaire :</span>
                </label>
                <span className="text-[11px] text-slate-400">Ex: EX-0001-01</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={codeBarre}
                  onChange={(e) => setCodeBarre(e.target.value.toUpperCase())}
                  placeholder="EX-XXXX-XX"
                  className="flex-1 font-mono text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'exemplaire',
                      title: "Scanner le code-barre de l'exemplaire (Caméra)",
                      initialMode: 'camera',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Utiliser la caméra / webcam pour scanner le code-barre du livre"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Scanner avec la caméra</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'exemplaire',
                      title: "Scanner le code-barre de l'exemplaire (Import de fichier depuis l’ordinateur)",
                      initialMode: 'fichier',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Importer une image de code-barre (PNG, JPG, WEBP) depuis l'ordinateur"
                >
                  <Upload className="w-4 h-4 text-violet-600" />
                  <span>Importer un fichier</span>
                </button>
              </div>

              {/* Raccourcis de test pour l'exemplaire */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400">Sélection rapide TP :</span>
                {exemplaires.slice(0, 6).map((ex) => {
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setCodeBarre(ex.code_barre)}
                      className={`text-xs px-2 py-0.5 rounded border transition cursor-pointer ${
                        codeBarre === ex.code_barre
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {ex.code_barre} ({ex.etat})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton de validation */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!audit.valide}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition shadow ${
                  audit.valide
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <span>Enregistrer le prêt au comptoir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Feedback message */}
          {lastResult && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm border flex items-start gap-3 ${
                lastResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{lastResult.success ? 'Succès' : 'Prêt refusé'}</p>
                <p className="mt-0.5 text-xs">{lastResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Rule Check Panel (Les 4 Règles de gestion) */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Contrôle Système en Temps Réel</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                audit.valide ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {audit.valide ? 'Éligible' : 'Refusé'}
            </span>
          </h2>

          <div className="space-y-3 text-xs">
            {/* Condition 1: Abonnement valide */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">
                  1. Abonnement valide & compte actif
                </p>
                {audit.adherent ? (
                  <p className="text-slate-500 mt-0.5">
                    Expire le {audit.adherent.date_fin_abonnement} (Statut : {audit.adherent.statut})
                  </p>
                ) : (
                  <p className="text-slate-400 mt-0.5">En attente d'identification...</p>
                )}
              </div>
              {audit.adherent ? (
                audit.adherent.date_fin_abonnement >= currentSimulatedDate && audit.adherent.statut === 'actif' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )
              ) : (
                <span className="text-slate-300">-</span>
              )}
            </div>

            {/* Condition 2: Exemplaire disponible */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">
                  2. Exemplaire disponible ou réservé pour lui
                </p>
                {audit.exemplaire ? (
                  <p className="text-slate-500 mt-0.5">
                    État actuel de l'exemplaire : <strong className="font-mono">{audit.exemplaire.etat}</strong>
                  </p>
                ) : (
                  <p className="text-slate-400 mt-0.5">En attente du code-barre...</p>
                )}
              </div>
              {audit.exemplaire ? (
                audit.exemplaire.etat === 'DISPONIBLE' || audit.reservationLiee ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )
              ) : (
                <span className="text-slate-300">-</span>
              )}
            </div>

            {/* Condition 3: Quota < 3 emprunts */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">
                  3. Quota d'emprunts simultanés (Max 3)
                </p>
                {audit.adherent ? (
                  <p className="text-slate-500 mt-0.5">
                    Emprunts en cours :{' '}
                    <strong>
                      {
                        prets.filter(
                          (p) =>
                            p.adherent_id === audit.adherent?.id &&
                            (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
                        ).length
                      }{' '}
                      / 3
                    </strong>
                  </p>
                ) : (
                  <p className="text-slate-400 mt-0.5">En attente d'identification...</p>
                )}
              </div>
              {audit.adherent ? (
                prets.filter(
                  (p) =>
                    p.adherent_id === audit.adherent?.id &&
                    (p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
                ).length < 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )
              ) : (
                <span className="text-slate-300">-</span>
              )}
            </div>

            {/* Condition 4: Aucune pénalité impayée */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">
                  4. Aucune pénalité impayée
                </p>
                {audit.adherent ? (
                  (() => {
                    const pen = penalites.find(
                      (p) => p.adherent_id === audit.adherent?.id && !p.est_payee
                    );
                    return pen ? (
                      <p className="text-rose-600 font-semibold mt-0.5">
                        Impayé : {pen.montant.toFixed(0)} DH ({pen.motif})
                      </p>
                    ) : (
                      <p className="text-slate-500 mt-0.5">Situation financière en règle</p>
                    );
                  })()
                ) : (
                  <p className="text-slate-400 mt-0.5">En attente d'identification...</p>
                )}
              </div>
              {audit.adherent ? (
                !penalites.some(
                  (p) => p.adherent_id === audit.adherent?.id && !p.est_payee
                ) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )
              ) : (
                <span className="text-slate-300">-</span>
              )}
            </div>

            {/* Error banner if rejected */}
            {!audit.valide && audit.erreur && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Blocage métier (Section 7) :</span>
                  <p className="mt-0.5 font-medium italic">« {audit.erreur} »</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale de scan Caméra / Plan de secours (QR Code carte ou code-barre) */}
      {scannerModal && (
        <CameraScannerModal
          isOpen={scannerModal.isOpen}
          onClose={() => setScannerModal(null)}
          title={scannerModal.title}
          type={scannerModal.type}
          adherents={adherents}
          exemplaires={exemplaires}
          ouvrages={ouvrages}
          initialMode={scannerModal.initialMode || 'camera'}
          onScanSuccess={(scannedVal) => {
            if (scannerModal.type === 'carte') {
              setNumeroCarte(scannedVal);
            } else {
              setCodeBarre(scannedVal);
            }
          }}
        />
      )}
    </div>
  );
};
