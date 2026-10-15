import React, { useState } from 'react';
import { X, Coffee, Heart, Sparkles, ExternalLink, Check, Copy } from 'lucide-react';

interface CoffeeModalProps {
  onClose: () => void;
}

export const CoffeeModal: React.FC<CoffeeModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const kofiUrl = 'https://ko-fi.com/zeusstreamdeck';

  const handleCopy = () => {
    navigator.clipboard.writeText(kofiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto text-center">
        {/* Banner */}
        <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent p-6 flex flex-col items-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/20 mb-3">
            <Coffee size={30} />
          </div>

          <h3 className="font-extrabold text-xl text-white">¡Apoya a Zeus Stream Deck!</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Una alternativa 100% libre, de código abierto y sin costes mensuales para streamers y creadores de contenido.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-zinc-300">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Sparkles size={16} />
              <span>¿Por qué apoyar este proyecto?</span>
            </div>
            <ul className="space-y-1.5 text-zinc-400 pl-1">
              <li>• Sin hardware caro: reutiliza cualquier celular viejo o tablet.</li>
              <li>• Integración directa con OBS v5 y audio anti-copyright en red local.</li>
              <li>• Sin suscripciones ni publicidad. Hecho por la comunidad.</li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-2 pt-1">
            <a
              href="https://ko-fi.com"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm transition-all shadow-md shadow-amber-400/20 active:scale-98"
            >
              <Coffee size={18} />
              <span>Invitar un café en Ko-fi</span>
              <ExternalLink size={14} />
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '¡Enlace de donación copiado!' : 'Copiar enlace de donación'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-center text-[11px] text-zinc-500 gap-1">
          <span>Hecho con</span> <Heart size={12} className="text-rose-500 fill-rose-500" /> <span>para creadores de contenido</span>
        </div>
      </div>
    </div>
  );
};
