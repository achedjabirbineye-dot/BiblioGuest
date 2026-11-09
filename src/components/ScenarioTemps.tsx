import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FastForward,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EtatExemplaire } from '../types';

interface EtapeScenario {
  id: number;
  periode: string;
  dateDebut: string;
  dateFin: string;
  etat: EtatExemplaire;
  evenement: string;
  acteur: string;
  descriptionDetaillee: string;
  penaliteInfo?: string;
  reservationInfo?: string;
}

export const ETAPES_SCENARIO: EtapeScenario[] = [
  {
    id: 1,
    periode: '01/10 → 06/10',
    dateDebut: '2026-10-01',
    dateFin: '2026-10-06',
    etat: 'DISPONIBLE',
    evenement: 'Ajout au catalogue',
    acteur: 'Bibliothécaire',
    descriptionDetaillee:
      'L’exemplaire (ex: EX-0001-01) est réceptionné, étiqueté avec son code-barre et intégré au catalogue avec l’état initial DISPONIBLE.',
  },
  {
    id: 2,
    periode: '06/10 → 21/10',
    dateDebut: '2026-10-06',
    dateFin: '2026-10-21',
    etat: 'EMPRUNTE',
    evenement: 'enregistrer_pret() (durée 15 jours)',
    acteur: 'Comptoir (Bibliothécaire + Karim Alami ETU-2025-0001)',
    descriptionDetaillee:
      'L’adhérent présente sa carte au comptoir. Vérification des 4 règles. Le bibliothécaire enregistre le prêt. Date de retour fixée au 21/10. L’exemplaire passe à EMPRUNTE.',
  },
  {
    id: 3,
    periode: '21/10 → 27/10',
    dateDebut: '2026-10-21',
    dateFin: '2026-10-27',
    etat: 'EN_RETARD',
    evenement: 'Date de retour prévue dépassée',
    acteur: 'Système (Détection automatique des retards)',
    descriptionDetaillee:
      'Le 21/10 est dépassé sans restitution. Le système fait basculer le prêt en EN_RETARD et l’exemplaire passe à l’état EN_RETARD (conformément au diagramme d’états Section 8).',
    penaliteInfo: 'Retard en cours de cumul : 6 jours de dépassement.',
  },
  {
    id: 4,
    periode: '27/10 → 29/10',
    dateDebut: '2026-10-27',
    dateFin: '2026-10-29',
    etat: 'DISPONIBLE',
    evenement: 'enregistrer_retour() + enregistrer_penalite()',
    acteur: 'Comptoir (Bibliothécaire + Karim Alami)',
    descriptionDetaillee:
      'Restitution au guichet le 27/10. Constat de 6 jours de retard. Le système propose 6 × 50 DH = 300 DH, plafonné obligatoirement à 100 DH. Le bibliothécaire valide enregistrer_penalite(100 DH). L’exemplaire redevient DISPONIBLE.',
    penaliteInfo: 'Pénalité calculée : 6 j × 50 DH = 300 DH plafonnée à 100 DH. Enregistrée avec succès.',
  },
  {
    id: 5,
    periode: '29/10 → 13/11',
    dateDebut: '2026-10-29',
    dateFin: '2026-10-13',
    etat: 'EMPRUNTE',
    evenement: 'enregistrer_pret() (nouvel emprunteur)',
    acteur: 'Comptoir (Bibliothécaire + Sara Bennani ETU-2024-0002)',
    descriptionDetaillee:
      'Un nouvel adhérent en règle emprunte l’exemplaire au comptoir pour 15 jours. L’exemplaire repasse de DISPONIBLE à EMPRUNTE.',
  },
  {
    id: 6,
    periode: '13/11 → 16/11',
    dateDebut: '2026-11-13',
    dateFin: '2026-11-16',
    etat: 'RESERVE',
    evenement: 'retour avec réservation en attente',
    acteur: 'Comptoir (Sara Bennani restitue à temps)',
    descriptionDetaillee:
      'Restitution sans retard le 13/11. Une réservation était en attente pour Yassine Chraibi (FIFO). L’exemplaire passe à l’état RESERVE et est mis de côté pendant 7 jours.',
    reservationInfo: 'Attribué à la réservation active de Yassine Chraibi. Délai de retrait de 7 jours fixé au 20/11.',
  },
  {
    id: 7,
    periode: '16/11 → 01/12',
    dateDebut: '2026-11-16',
    dateFin: '2026-12-01',
    etat: 'EMPRUNTE',
    evenement: 'enregistrer_pret() au réservataire',
    acteur: 'Comptoir (Yassine Chraibi retire sa réservation)',
    descriptionDetaillee:
      'Yassine Chraibi se présente au comptoir avant expiration. Le bibliothécaire enregistre le prêt. La réservation passe à HONOREE et l’exemplaire repasse à EMPRUNTE pour 15 jours.',
  },
  {
    id: 8,
    periode: '01/12 → 05/12',
    dateDebut: '2026-12-01',
    dateFin: '2026-12-05',
    etat: 'DISPONIBLE',
    evenement: 'enregistrer_retour()',
    acteur: 'Comptoir (Restitution normale)',
    descriptionDetaillee:
      'Restitution le 01/12 à la date exacte prévue. Aucune réservation en attente. Le prêt est clôturé et l’exemplaire repasse définitivement à DISPONIBLE.',
  },
];

interface ScenarioTempsProps {
  onSyncSimulatedDate?: (dateStr: string) => void;
}

export const ScenarioTemps: React.FC<ScenarioTempsProps> = ({ onSyncSimulatedDate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const currentStep = ETAPES_SCENARIO[currentStepIndex];

  // Lecture automatique
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= ETAPES_SCENARIO.length - 1) {
            setIsPlaying(false);
            confetti({ particleCount: 60, spread: 70 });
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleSetStep = (index: number) => {
    setCurrentStepIndex(index);
    if (onSyncSimulatedDate) {
      onSyncSimulatedDate(ETAPES_SCENARIO[index].dateDebut);
    }
  };

  const getEtatBadgeColor = (etat: EtatExemplaire) => {
    switch (etat) {
      case 'DISPONIBLE':
        return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'EMPRUNTE':
        return 'bg-blue-600 text-white shadow-blue-500/20';
      case 'EN_RETARD':
        return 'bg-rose-600 text-white shadow-rose-500/20 animate-pulse';
      case 'RESERVE':
        return 'bg-amber-500 text-white shadow-amber-500/20';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                Diagramme de temps validé (Section 10)
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Simulateur & Rejeu du Scénario de Référence (01/10 → 05/12)
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Ce scénario officiel démontre le cycle de vie complet d'un exemplaire sur 2 mois,
              illustrant toutes les transitions d'états (prêt, retard, pénalité, retour avec réservation).
            </p>
          </div>

          {/* Contrôles du rejeu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shadow ${
                isPlaying
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Lecture Auto'}</span>
            </button>

            <button
              onClick={() => handleSetStep(0)}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs"
              title="Recommencer au début"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Bar graphique */}
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {ETAPES_SCENARIO.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => handleSetStep(idx)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-md'
                      : isPast
                      ? 'border-slate-200 bg-white hover:bg-slate-50 opacity-90'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">#{step.id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${getEtatBadgeColor(step.etat)}`}>
                      {step.etat}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 font-semibold mt-2">
                    {step.periode}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    {step.evenement}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Focus sur l'étape courante */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Étape {currentStep.id} sur 8 • Période {currentStep.periode}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                {currentStep.evenement}
              </h2>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-xs font-black shadow ${getEtatBadgeColor(currentStep.etat)}`}>
              ÉTAT : {currentStep.etat}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Acteurs impliqués :
              </span>
              <p className="font-medium text-slate-800">{currentStep.acteur}</p>
            </div>

            <div className="p-4 bg-blue-50/40 rounded-lg border border-blue-200 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block mb-1">
                Explication du scénario temporel UML :
              </span>
              <p>{currentStep.descriptionDetaillee}</p>
            </div>

            {currentStep.penaliteInfo && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Calcul de pénalité (Section 5) :</span>
                  <p className="mt-0.5">{currentStep.penaliteInfo}</p>
                </div>
              </div>
            )}

            {currentStep.reservationInfo && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Attribution de Réservation (FIFO) :</span>
                  <p className="mt-0.5">{currentStep.reservationInfo}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stepper buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => handleSetStep(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Étape précédente
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Étape {currentStepIndex + 1} / {ETAPES_SCENARIO.length}
            </span>

            <button
              onClick={() => handleSetStep(Math.min(ETAPES_SCENARIO.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === ETAPES_SCENARIO.length - 1}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              Étape suivante →
            </button>
          </div>
        </div>

        {/* Tableau récapitulatif Section 10 */}
        <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 shadow-sm border border-slate-200 text-xs space-y-3">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
            Tableau officiel de référence
          </h3>

          <div className="space-y-1.5">
            {ETAPES_SCENARIO.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => handleSetStep(idx)}
                className={`p-2 rounded border cursor-pointer transition ${
                  idx === currentStepIndex
                    ? 'bg-blue-100 border-blue-400 font-semibold text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px]">{s.periode}</span>
                  <span className="font-bold text-[10px]">{s.etat}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{s.evenement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
