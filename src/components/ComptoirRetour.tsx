import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookCheck,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CameraScannerModal, ScannerMode } from './CameraScannerModal';
import {
  Adherent,
  Bibliothecaire,
  Exemplaire,
  Ouvrage,
  ParametresSysteme,
  Penalite,
  Pret,
  Reservation,
} from '../types';
import { verifierEligibiliteRetour } from '../services/libraryService';

interface ComptoirRetourProps {
  bibliothecaire: Bibliothecaire;
  exemplaires: Exemplaire[];
  prets: Pret[];
  ouvrages: Ouvrage[];
  adherents: Adherent[];
  reservations: Reservation[];
  currentSimulatedDate: string;
  parametres: ParametresSysteme;
  onEnregistrerRetour: (
    exemplaireId: number,
    avecPenalite: boolean,
    montantPenalite?: number,
    motifPenalite?: string
  ) => void;
}

export const ComptoirRetour: React.FC<ComptoirRetourProps> = ({
  bibliothecaire,
  exemplaires,
  prets,
  ouvrages,
  adherents,
  reservations,
  currentSimulatedDate,
  parametres,
  onEnregistrerRetour,
}) => {
  const [numeroCarte, setNumeroCarte] = useState<string>('');
  const [codeBarre, setCodeBarre] = useState<string>('EX-0002-01'); // Code-barre Clean Code (en retard)
  const [carteError, setCarteError] = useState<string | null>(null);
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    type: 'carte' | 'exemplaire';
    title: string;
    initialMode?: ScannerMode;
  } | null>(null);

  const [modalPenalite, setModalPenalite] = useState<{
    open: boolean;
    pret: Pret;
    exemplaire: Exemplaire;
    adherent: Adherent;
    ouvrage: Ouvrage;
    joursRetard: number;
    montantPropose: number;
  } | null>(null);

  const [montantPersonnalise, setMontantPersonnalise] = useState<number>(0);
  const [motifPersonnalise, setMotifPersonnalise] = useState<string>('Retard de restitution');
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Recherche des prêts actifs
  const pretsActifs = prets.filter(
    (p) => p.statut === 'EN_COURS' || p.statut === 'EN_RETARD'
  );

  const handleCarteChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setNumeroCarte(upper);
    if (!upper) {
      setCarteError(null);
      return;
    }
    const adh = adherents.find((a) => a.numero_carte.toUpperCase() === upper);
    if (!adh) {
      setCarteError('Carte non reconnue. Vérifiez auprès de l’administration.');
    } else {
      setCarteError(null);
      // Si l'adhérent a des prêts en cours, auto-sélectionner son premier exemplaire pour faciliter le retour
      const pretsDeLAdherent = pretsActifs.filter((p) => p.adherent_id === adh.id);
      if (pretsDeLAdherent.length > 0) {
        const exLie = exemplaires.find((e) => e.id === pretsDeLAdherent[0].exemplaire_id);
        if (exLie) {
          setCodeBarre(exLie.code_barre);
        }
      }
    }
  };

  const executerInspectionRetour = (codeToInspect: string) => {
    const cleanCode = codeToInspect.trim().toUpperCase();
    setCodeBarre(cleanCode);
    setLastActionFeedback(null);

    if (!cleanCode) {
      setLastActionFeedback({
        success: false,
        message: 'Veuillez saisir ou scanner un code-barre d’exemplaire.',
      });
      return;
    }

    try {
      const inspect = verifierEligibiliteRetour(
        cleanCode,
        exemplaires,
        prets,
        ouvrages,
        adherents,
        currentSimulatedDate,
        parametres
      );

      // Si le prêt est en retard, ouvrir la boîte de dialogue de validation de pénalité (Section 5)
      if (inspect.aDuRetard) {
        setMontantPersonnalise(inspect.montantPenalite);
        setMotifPersonnalise(
          `Retard de restitution (${inspect.joursRetard} jours de retard constatés)`
        );
        setModalPenalite({
          open: true,
          pret: inspect.pret,
          exemplaire: inspect.exemplaire,
          adherent: inspect.adherent!,
          ouvrage: inspect.ouvrage!,
          joursRetard: inspect.joursRetard,
          montantPropose: inspect.montantPenalite,
        });
      } else {
        // Retour normal à l'heure
        onEnregistrerRetour(inspect.exemplaire.id, false);
        confetti({ particleCount: 40, spread: 50 });
        setLastActionFeedback({
          success: true,
          message: `Retour enregistré avec succès à l'heure pour « ${inspect.ouvrage?.titre} » (${inspect.exemplaire.code_barre}). Aucune pénalité requise.`,
        });
      }
    } catch (err: any) {
      setLastActionFeedback({
        success: false,
        message: err.message,
      });
    }
  };

  const handleInspectRetour = (e: React.FormEvent) => {
    e.preventDefault();
    executerInspectionRetour(codeBarre);
  };

  const handleConfirmerRetourAvecPenalite = (validerPenalite: boolean) => {
    if (!modalPenalite) return;

    try {
      onEnregistrerRetour(
        modalPenalite.exemplaire.id,
        validerPenalite,
        validerPenalite ? montantPersonnalise : 0,
        motifPersonnalise
      );
      setModalPenalite(null);
      confetti({ particleCount: 50, spread: 60 });
      setLastActionFeedback({
        success: true,
        message: validerPenalite
          ? `Retour enregistré avec pénalité de ${montantPersonnalise.toFixed(0)} DH appliquée à ${modalPenalite.adherent.prenom} ${modalPenalite.adherent.nom}.`
          : `Retour enregistré sans pénalité (dispensée par le bibliothécaire).`,
      });
    } catch (err: any) {
      setLastActionFeedback({
        success: false,
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                Diagramme d'activités (Section 9)
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Comptoir de Restitution & Gestion des Retards
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              À chaque retour, le système vérifie si la date prévue est dépassée. Le montant
              est calculé (50 DH / jour, max 100 DH), puis validé par le bibliothécaire avant création.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Date de restitution : <strong>{currentSimulatedDate}</strong></span>
          </div>
        </div>

        {/* Info règles de retour */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-slate-600">
              <strong>Calcul automatique du retard :</strong> {parametres.penaliteParJour.toFixed(0)} DH par jour de retard,
              plafonné obligatoirement à {parametres.plafondPenalite.toFixed(0)} DH. Jamais de pénalité créée sans validation du bibliothécaire.
            </p>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-amber-800">
              <strong>Réservation en attente (FIFO) :</strong> Si une réservation existe pour cet ouvrage, l'exemplaire
              passe directement à l'état <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">RESERVE</code> (validité 7 jours pour retrait).
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de restitution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>Enregistrer un retour physique</span>
          </h2>

          <form onSubmit={handleInspectRetour} className="space-y-4">
            {/* Bannière Plan de secours actif */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Comptoir de Retour :</strong> Scannez le code-barre de l'exemplaire via la caméra ou importez une image. Le retour sera analysé immédiatement (Section 9).
                </span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 shrink-0">
                Retour Exemplaire
              </span>
            </div>

            {/* 1. SECTION PRINCIPALE : SCAN DE L'EXEMPLAIRE RESTITUÉ */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <BookCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Exemplaire restitué (Code-barre obligatoire) :</span>
                </label>
                <span className="text-[11px] text-blue-600 font-medium">Ex: EX-0002-01</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={codeBarre}
                  onChange={(e) => setCodeBarre(e.target.value.toUpperCase())}
                  placeholder="EX-XXXX-XX"
                  className="flex-1 font-mono text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-blue-300 shadow-xs font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'exemplaire',
                      title: "Scanner l'exemplaire restitué (Caméra)",
                      initialMode: 'camera',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Utiliser la caméra / webcam pour scanner le code-barre de l'exemplaire"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scanner avec la caméra</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScannerModal({
                      isOpen: true,
                      type: 'exemplaire',
                      title: "Scanner l'exemplaire restitué (Import Fichier PC)",
                      initialMode: 'fichier',
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                  title="Importer une image de code-barre (PNG, JPG, WEBP) depuis votre ordinateur"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer un fichier</span>
                </button>
              </div>

              {/* Raccourcis des prêts en cours pour sélection rapide */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium flex items-center justify-between">
                  <span>Sélection rapide d'un prêt en cours (1 clic = retour immédiat) :</span>
                  <span className="font-semibold text-blue-700">{pretsActifs.length} en cours</span>
                </p>
                {pretsActifs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun prêt en cours à restituer.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {pretsActifs.map((p) => {
                      const ex = exemplaires.find((e) => e.id === p.exemplaire_id);
                      const ouv = ex ? ouvrages.find((o) => o.id === ex.ouvrage_id) : null;
                      const isLate = p.date_retour_prevue < currentSimulatedDate;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (ex) {
                              executerInspectionRetour(ex.code_barre);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                            codeBarre === ex?.code_barre
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                              : isLate
                              ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono font-bold">{ex?.code_barre}</span> - {ouv?.titre.slice(0, 18)}...
                          {isLate ? ' ⚠️ EN RETARD' : ' (À temps)'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. SECTION SECONDAIRE : CARTE ADHÉRENT (OPTIONNEL) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>2. Numéro de carte adhérent (Optionnel — filtrage des emprunts) :</span>
                </label>
                <span className="text-[11px] text-slate-400">Ex: ETU-2025-0001</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={numeroCarte}
                  onChange={(e) => handleCarteChange(e.target.value)}
                  placeholder="ETU-2025-XXXX (Optionnel)"
                  className="flex-1 font-mono text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
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
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Scanner la carte (Caméra)</span>
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
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Fichier</span>
                </button>
              </div>

              {carteError && (
                <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold">{carteError}</span>
                </div>
              )}

              {/* Raccourcis rapides des adhérents ayant des prêts en cours */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400">Filtrer par adhérent :</span>
                {adherents
                  .filter((a) => pretsActifs.some((p) => p.adherent_id === a.id))
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleCarteChange(a.numero_carte)}
                      className={`text-xs px-2 py-0.5 rounded border transition cursor-pointer ${
                        numeroCarte === a.numero_carte
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {a.numero_carte} ({a.prenom})
                    </button>
                  ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition shadow cursor-pointer"
              >
                <BookCheck className="w-4 h-4" />
                <span>Traiter le retour de l'exemplaire</span>
              </button>
            </div>
          </form>

          {lastActionFeedback && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm border flex items-start gap-3 ${
                lastActionFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {lastActionFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{lastActionFeedback.success ? 'Succès' : 'Erreur de retour'}</p>
                <p className="mt-0.5 text-xs">{lastActionFeedback.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Prêts en cours aperçu */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Prêts Actifs à Restituer</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              {pretsActifs.length} en circulation
            </span>
          </h2>

          <div className="space-y-2.5 text-xs">
            {pretsActifs.map((p) => {
              const ex = exemplaires.find((e) => e.id === p.exemplaire_id);
              const adh = adherents.find((a) => a.id === p.adherent_id);
              const ouv = ex ? ouvrages.find((o) => o.id === ex.ouvrage_id) : null;
              const isLate = p.date_retour_prevue < currentSimulatedDate;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border bg-white ${
                    isLate ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{ouv?.titre}</p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        Exemplaire : {ex?.code_barre} | État : <span className="font-semibold">{ex?.etat}</span>
                      </p>
                      <p className="text-slate-600 mt-1">
                        Emprunteur : <strong>{adh?.prenom} {adh?.nom}</strong> ({adh?.numero_carte})
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLate
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isLate ? 'EN RETARD' : 'EN COURS'}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Prêt le : {p.date_pret}</span>
                    <span className={isLate ? 'font-bold text-rose-600' : ''}>
                      Retour prévu : {p.date_retour_prevue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modale de validation de pénalité en cas de retard (Section 5) */}
      {modalPenalite && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Retard constaté lors du retour
                </h3>
                <p className="text-xs text-slate-500">
                  Validation obligatoire par le bibliothécaire (Règle de gestion Section 5)
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Adhérent :</span>
                <span className="font-semibold text-slate-800">
                  {modalPenalite.adherent.prenom} {modalPenalite.adherent.nom} ({modalPenalite.adherent.numero_carte})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ouvrage restitué :</span>
                <span className="font-semibold text-slate-800">{modalPenalite.ouvrage.titre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date de retour prévue :</span>
                <span className="font-mono text-slate-700">{modalPenalite.pret.date_retour_prevue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date de restitution effective :</span>
                <span className="font-mono font-bold text-rose-600">{currentSimulatedDate}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-semibold">Nombre de jours de retard :</span>
                <span className="font-bold text-rose-600 text-sm">{modalPenalite.joursRetard} jour(s)</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
                <span className="text-amber-900 font-semibold">
                  Montant proposé par le système (50 DH / j, max 100 DH) :
                </span>
                <span className="text-base font-extrabold text-amber-800 font-mono">
                  {modalPenalite.montantPropose.toFixed(0)} DH
                </span>
              </div>
            </div>

            {/* Ajustement du bibliothécaire si nécessaire */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant à enregistrer (DH) :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    max="100"
                    value={montantPersonnalise}
                    onChange={(e) => setMontantPersonnalise(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 pl-7 border rounded-lg border-slate-300 font-mono font-bold"
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Plafond légal : 100 DH. L'adhérent sera bloqué pour tout nouvel emprunt tant que la pénalité reste impayée.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif de la pénalité :
                </label>
                <input
                  type="text"
                  value={motifPersonnalise}
                  onChange={(e) => setMotifPersonnalise(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg border-slate-300"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleConfirmerRetourAvecPenalite(true)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <span>Enregistrer la pénalité & Clôturer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleConfirmerRetourAvecPenalite(false)}
                className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs"
              >
                Dispensé (Sans pénalité)
              </button>

              <button
                type="button"
                onClick={() => setModalPenalite(null)}
                className="py-2.5 px-3 rounded-lg text-slate-400 hover:text-slate-600 text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de scan Caméra / Plan de secours (QR Code carte adhérent ou code-barre exemplaire) */}
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
              handleCarteChange(scannedVal);
            } else {
              executerInspectionRetour(scannedVal);
            }
          }}
          onScanError={(err) => {
            if (scannerModal.type === 'carte') {
              setCarteError(err);
            }
          }}
        />
      )}
    </div>
  );
};
