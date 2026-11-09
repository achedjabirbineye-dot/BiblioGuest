import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileCode,
  Folder,
  Layers,
  Terminal,
} from 'lucide-react';
import { FLASK_PROJECT_FILES, FlaskFile } from '../data/flaskCodebase';

export const FlaskSourceView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlaskFile>(FLASK_PROJECT_FILES[1]); // config.py
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'fichier.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                Code Source Flask & TP Académique
              </span>
              <h1 className="text-xl font-bold text-slate-800">
                Code Python 3.10+ / Flask / SQLAlchemy / pytest Prêt pour Rendu TP
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Tous les fichiers du projet organisés selon l'architecture MVC validée.
              Téléchargeables ou copiables pour exécution locale avec <code>pytest</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>pytest -v tests/</span>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="mt-4 p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <strong>Comment exécuter en local sur votre machine :</strong>
            <p className="mt-0.5 text-purple-800 font-mono">
              1. <code>python -m venv venv && source venv/bin/activate</code><br />
              2. <code>pip install -r requirements.txt</code><br />
              3. <code>pytest -v</code> (valide les 5 tests obligatoires de la section 13)<br />
              4. <code>flask run</code> (lance le serveur local sur port 5000)
            </p>
          </div>
        </div>
      </div>

      {/* Explorer + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Arborescence du Projet
          </h2>

          <div className="space-y-1 text-xs">
            {FLASK_PROJECT_FILES.map((f) => {
              const isSelected = selectedFile.path === f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                    <span className="font-mono text-xs truncate">{f.path}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-purple-700 text-purple-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {f.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code View */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-800 flex flex-col">
          {/* File header bar */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-300 border-b border-slate-700">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-purple-400 font-bold">{selectedFile.path}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px]">{selectedFile.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>

          {/* Code content */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed max-h-[580px] overflow-y-auto">
            <pre>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
