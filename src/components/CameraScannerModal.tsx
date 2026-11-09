import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  CameraOff,
  CheckCircle2,
  FileImage,
  FolderOpen,
  HelpCircle,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Adherent, Exemplaire, Ouvrage } from '../types';

export type ScannerMode = 'camera' | 'fichier' | 'secours';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'carte' | 'exemplaire';
  adherents?: Adherent[];
  exemplaires?: Exemplaire[];
  ouvrages?: Ouvrage[];
  initialMode?: ScannerMode;
  onScanSuccess: (scannedValue: string) => void;
  onScanError?: (errorMessage: string, rawValue?: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  adherents = [],
  exemplaires = [],
  ouvrages = [],
  initialMode = 'camera',
  onScanSuccess,
  onScanError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ScannerMode>(initialMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);

  // Gestion de l'import de fichier depuis l'ordinateur
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileDecoding, setFileDecoding] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [decodedPreview, setDecodedPreview] = useState<string | null>(null);

  // Filtre et recherche pour le plan de secours
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [etatFilter, setEtatFilter] = useState<string>('TOUS');
  const [manualInputValue, setManualInputValue] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'code_39', 'data_matrix'],
        });
      } catch (e) {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setErrorMessage(null);
      setUnrecognizedCode(null);
      setCameraError(null);
      setFileError(null);
      setPreviewImage(null);
      setDecodedPreview(null);
      setSearchFilter('');
      setManualInputValue('');
      return;
    }

    setActiveTab(initialMode);

    if (initialMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, initialMode]);

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    setUnrecognizedCode(null);
    isScanningRef.current = true;

    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraActive(false);
      setCameraError(
        "L'API Caméra n'est pas supportée dans ce navigateur ou est restreinte. Vous pouvez utiliser l'import de fichier image depuis votre ordinateur."
      );
      return;
    }

    let stream: MediaStream | null = null;

    // Tentative 1 : Caméra arrière (environnement smartphone/tablette)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (e1) {
      // Tentative 2 : Caméra avant / frontale
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
      } catch (e2) {
        // Tentative 3 : Toute caméra vidéo disponible sans contrainte
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e3: any) {
          console.warn("Échec complet d'accès caméra :", e3);
          setIsCameraActive(false);
          let msg = "Impossible d'accéder à la caméra.";
          if (e3.name === 'NotAllowedError' || e3.name === 'PermissionDeniedError') {
            msg = "Permission caméra refusée par le navigateur. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur ou utiliser l'import de fichier image ci-dessous.";
          } else if (e3.name === 'NotFoundError' || e3.name === 'DevicesNotFoundError') {
            msg = "Aucune caméra/webcam détectée sur cet appareil. Utilisez l'import de fichier image depuis l'ordinateur.";
          } else {
            msg = `Accès caméra non disponible (${e3.message || e3.name}). Utilisez l'import de fichier image ci-dessous.`;
          }
          setCameraError(msg);
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((pErr) => console.warn('Play error:', pErr));
          setIsCameraActive(true);
          scanFrame();
        };

        try {
          await videoRef.current.play();
          setIsCameraActive(true);
          scanFrame();
        } catch (playErr) {
          console.warn('Play attempt:', playErr);
        }
      }
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleDecodedCode = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    if (type === 'carte') {
      // Vérifier si la carte est reconnue parmi les adhérents
      const match = adherents.find((a) => a.numero_carte.toUpperCase() === code);
      if (match) {
        stopCamera();
        onScanSuccess(match.numero_carte);
        onClose();
      } else {
        // Message d'erreur obligatoire Section 7
        const msg = 'Carte non reconnue. Vérifiez auprès de l’administration.';
        setErrorMessage(msg);
        setUnrecognizedCode(code);
        if (onScanError) {
          onScanError(msg, code);
        }
      }
    } else {
      // Pour un exemplaire, on remplit directement le code-barre lu
      stopCamera();
      onScanSuccess(code);
      onClose();
    }
  };

  const scanFrame = async () => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    try {
      if (video && (video.readyState >= 2 || video.readyState === video.HAVE_ENOUGH_DATA) && video.videoWidth > 0) {
        // 1. Essai avec BarcodeDetector natif si disponible
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleDecodedCode(barcodes[0].rawValue);
              return;
            }
          } catch {
            // Ignorer et passer à jsQR
          }
        }

        // 2. Repli avec jsQR sur canvas
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              handleDecodedCode(code.data);
              return;
            }
          }
        }
      }
    } catch (frameErr) {
      console.warn('Frame processing:', frameErr);
    }

    if (isScanningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // Traitement d'un fichier image (drag & drop ou sélection par boîte de dialogue)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFileError('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).');
      return;
    }

    setFileDecoding(true);
    setFileError(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);

      const img = new Image();
      img.onload = async () => {
        try {
          // 1. Essai BarcodeDetector natif
          if (barcodeDetectorRef.current) {
            try {
              const barcodes = await barcodeDetectorRef.current.detect(img);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const found = barcodes[0].rawValue;
                setDecodedPreview(found);
                setFileDecoding(false);
                setTimeout(() => handleDecodedCode(found), 250);
                return;
              }
            } catch {
              // fallback to jsQR
            }
          }

          // 2. Essai canvas + jsQR
          const offCanvas = document.createElement('canvas');
          offCanvas.width = img.naturalWidth || img.width;
          offCanvas.height = img.naturalHeight || img.height;
          const ctx = offCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data) {
              setDecodedPreview(code.data);
              setFileDecoding(false);
              setTimeout(() => handleDecodedCode(code.data), 250);
              return;
            }
          }

          setFileDecoding(false);
          setFileError(
            "Aucun QR code ou code-barre lisible n'a été détecté dans cette image. Assurez-vous que le code est net et bien contrasté."
          );
        } catch (err: any) {
          setFileDecoding(false);
          setFileError("Erreur lors de la lecture de l'image. Veuillez réessayer.");
        }
      };
      img.onerror = () => {
        setFileDecoding(false);
        setFileError("Format d'image non valide.");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  if (!isOpen) return null;

  // Filtrage des adhérents pour le plan de secours
  const filteredAdherents = adherents.filter((a) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      a.nom.toLowerCase().includes(q) ||
      a.prenom.toLowerCase().includes(q) ||
      a.numero_carte.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  // Filtrage des exemplaires pour le plan de secours
  const filteredExemplaires = exemplaires.filter((ex) => {
    if (etatFilter !== 'TOUS' && ex.etat !== etatFilter) return false;
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    const ouv = ouvrages.find((o) => o.id === ex.ouvrage_id);
    return (
      ex.code_barre.toLowerCase().includes(q) ||
      (ouv && ouv.titre.toLowerCase().includes(q)) ||
      (ouv && ouv.auteur.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'camera' && <Camera className="w-5 h-5 text-blue-400" />}
            {activeTab === 'fichier' && <Upload className="w-5 h-5 text-violet-400" />}
            {activeTab === 'secours' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            <div>
              <h3 className="font-bold text-sm tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">
                {type === 'carte' ? 'Identification Carte Étudiant' : 'Identification Exemplaire'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher : 1) Caméra | 2) Import de fichier depuis l'ordinateur | 3) Douchette de secours */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 text-center ${
              activeTab === 'camera'
                ? 'bg-white text-blue-600 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Caméra</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('fichier');
            }}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 text-center ${
              activeTab === 'fichier'
                ? 'bg-white text-violet-700 border-violet-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0 text-violet-600" />
            <span className="truncate">2. Import Fichier</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-violet-100 text-violet-800 font-bold hidden sm:inline">
              PC
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('secours');
            }}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 text-center ${
              activeTab === 'secours'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="truncate">3. Repli Douchette</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ONGLET 1 : SCAN PAR CAMERA EN DIRECT                      */}
        {/* ========================================================= */}
        {activeTab === 'camera' && (
          <div className="flex-1 overflow-y-auto">
            {/* Viewport Caméra */}
            <div className="relative bg-black flex items-center justify-center min-h-[250px] max-h-[310px] overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Cadre de visée */}
              {isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br" />
                    <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-blue-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                  </div>
                </div>
              )}

              {/* Si erreur caméra */}
              {cameraError && (
                <div className="p-6 text-center text-xs text-slate-300 space-y-2 z-10">
                  <CameraOff className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="font-semibold text-white">Caméra inaccessible</p>
                  <p className="text-slate-400 leading-relaxed">{cameraError}</p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Réessayer la caméra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('fichier')}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer un fichier image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('secours')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Douchette de secours</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Pointez la caméra vers le {type === 'carte' ? 'QR Code de la carte' : 'code-barre'}.
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('fichier');
                }}
                className="text-violet-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Préférer l'import de fichier</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 2 : SCAN PAR IMPORTATION DE FICHIER DEPUIS LE PC  */}
        {/* ========================================================= */}
        {activeTab === 'fichier' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Bannière explicative */}
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-950 flex items-start gap-2.5">
              <Upload className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Scan par importation de fichier depuis votre ordinateur
                </p>
                <p className="text-violet-800 text-[11px] mt-0.5 leading-relaxed">
                  Sélectionnez ou glissez-déposez une photo / capture d'écran contenant le{' '}
                  {type === 'carte' ? 'QR Code de la carte étudiant' : "code-barre de l'exemplaire"}.
                  Le décodage s'effectue immédiatement en local.
                </p>
              </div>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-scan-upload-native"
            />

            {/* Zone de Drag & Drop stylisée */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition flex flex-col items-center justify-center text-center ${
                isDragging
                  ? 'border-violet-600 bg-violet-100/70 scale-[0.99]'
                  : 'border-slate-300 hover:border-violet-500 bg-slate-50 hover:bg-violet-50/40'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mb-2 shadow-xs">
                {fileDecoding ? (
                  <Sparkles className="w-6 h-6 animate-spin text-violet-600" />
                ) : (
                  <FolderOpen className="w-6 h-6 text-violet-600" />
                )}
              </div>

              <p className="text-sm font-bold text-slate-800">
                {fileDecoding
                  ? 'Analyse et décodage du code...'
                  : "Cliquer pour parcourir les fichiers de l'ordinateur"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ou glissez-déposez votre image ici (PNG, JPG, WEBP)
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Sélectionner un fichier sur l'ordinateur</span>
              </button>
            </div>

            {/* Aperçu de l'image analysée si présente */}
            {previewImage && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={previewImage}
                  alt="Aperçu code scanné"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-xs shrink-0"
                />
                <div className="text-xs overflow-hidden">
                  <p className="font-semibold text-slate-800">Fichier chargé</p>
                  {decodedPreview ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold mt-0.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span className="font-mono">{decodedPreview} (Reconnu !)</span>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {fileDecoding ? 'Lecture en cours...' : 'Analyse terminée'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Erreur de décodage fichier */}
            {fileError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Lecture impossible :</span>
                  <p className="mt-0.5">{fileError}</p>
                </div>
              </div>
            )}

            {/* Raccourci rapide vers le test TP */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Pas de fichier image sous la main ?</span>
              <button
                type="button"
                onClick={() => setActiveTab('secours')}
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Utiliser la sélection directe de secours</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 3 : DOUCHETTE VIRTUELLE & SELECTION DE SECOURS    */}
        {/* ========================================================= */}
        {activeTab === 'secours' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Bannière explicative Plan de Secours */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">
                  Plan de secours (Douchette virtuelle & Saisie assistée)
                </p>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Permet de sélectionner immédiatement n'importe quelle carte ou exemplaire en un seul
                  clic sans passer par la caméra ou un fichier image.
                </p>
              </div>
            </div>

            {/* Champ de recherche rapide */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={
                    type === 'carte'
                      ? 'Rechercher étudiant par nom, prénom ou carte...'
                      : 'Rechercher par code-barre, titre du livre...'
                  }
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filtre par état pour les exemplaires */}
              {type === 'exemplaire' && (
                <div className="flex flex-wrap gap-1 items-center text-[10px]">
                  <span className="text-slate-400 font-medium">État :</span>
                  {['TOUS', 'DISPONIBLE', 'EMPRUNTE', 'EN_RETARD', 'RESERVE'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEtatFilter(st)}
                      className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                        etatFilter === st
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Liste cliquable (Cartes Étudiants) */}
            {type === 'carte' && (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredAdherents.map((adh) => (
                  <button
                    key={adh.id}
                    type="button"
                    onClick={() => handleDecodedCode(adh.numero_carte)}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {adh.prenom.charAt(0)}
                        {adh.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-700">
                          {adh.prenom} {adh.nom}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 font-semibold">
                          {adh.numero_carte}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          adh.statut === 'actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {adh.statut}
                      </span>
                      <span className="text-[11px] text-blue-600 font-semibold underline group-hover:inline">
                        Sélectionner
                      </span>
                    </div>
                  </button>
                ))}

                {/* Bouton de test pour simuler une carte invalide (conformité Section 7) */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleDecodedCode('ETU-INCONNU-9999')}
                    className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Tester une carte non enregistrée pour vérifier le message d'erreur"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tester carte inconnue (Test erreur Section 7)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Liste cliquable (Exemplaires) */}
            {type === 'exemplaire' && (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredExemplaires.map((ex) => {
                  const ouv = ouvrages.find((o) => o.id === ex.ouvrage_id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleDecodedCode(ex.code_barre)}
                      className="w-full text-left p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-mono font-bold text-slate-800 group-hover:text-blue-700">
                            {ex.code_barre}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {ouv?.titre || 'Ouvrage'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ex.etat === 'DISPONIBLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ex.etat === 'EMPRUNTE'
                              ? 'bg-blue-100 text-blue-800'
                              : ex.etat === 'EN_RETARD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ex.etat}
                        </span>
                        <span className="text-[11px] text-blue-600 font-semibold underline group-hover:inline">
                          Sélectionner
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Bouton de test pour code-barre inconnu */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleDecodedCode('EX-INCONNU-9999')}
                    className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tester code-barre inconnu</span>
                  </button>
                </div>
              </div>
            )}

            {/* Saisie manuelle directe */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Saisie manuelle directe :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInputValue}
                  onChange={(e) => setManualInputValue(e.target.value.toUpperCase())}
                  placeholder={type === 'carte' ? 'Ex: ETU-2025-0001' : 'Ex: EX-0001-01'}
                  className="flex-1 text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualInputValue.trim()) {
                      handleDecodedCode(manualInputValue);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur officiel (Section 7) si carte non reconnue */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-y border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            {unrecognizedCode && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onScanSuccess(unrecognizedCode);
                  onClose();
                }}
                className="text-[11px] underline text-rose-700 hover:text-rose-900 cursor-pointer text-left"
              >
                Insérer « {unrecognizedCode} » dans le champ
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>2 modes de scan (Caméra / Fichier PC) + Saisie de secours.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
