import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Shield, Smartphone, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { NetworkInfo } from '../types.ts';

interface ConnectModalProps {
  networkInfo: NetworkInfo | null;
  onClose: () => void;
  onRefreshIps: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  networkInfo,
  onClose,
  onRefreshIps
}) => {
  const [selectedIpIndex, setSelectedIpIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const port = networkInfo?.port || 3000;
  const ips = networkInfo?.ips && networkInfo.ips.length > 0 ? networkInfo.ips : ['192.168.1.100'];
  const currentIp = ips[selectedIpIndex] || ips[0];
  const fullMobileUrl = `http://${currentIp}:${port}`;

  const netshCmd = `netsh advfirewall firewall add rule name="Zeus Stream Deck (Puerto ${port})" dir=in action=allow protocol=TCP localport=${port}`;
  const psCmd = `New-NetFirewallRule -DisplayName "Zeus Stream Deck Port ${port}" -Direction Inbound -LocalPort ${port} -Protocol TCP -Action Allow`;

  useEffect(() => {
    QRCode.toDataURL(fullMobileUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [fullMobileUrl]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Smartphone className="text-amber-400" size={20} />
            <h3 className="font-bold text-base text-zinc-100">Conectar Celular & Firewall Windows</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto text-sm text-zinc-200">
          {/* Step 1: Scan QR from Phone */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-inner flex items-center justify-center shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-black">
                  <QrCode size={36} className="animate-spin text-zinc-600" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-semibold">
                <span>Paso 1: Escanear con tu móvil</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Abre la app de cámara de tu celular (conectado al mismo Wi-Fi que la PC) y escanea el código para abrir la interfaz:
              </p>

              {/* IP Selector if multiple adapters exist */}
              {ips.length > 1 && (
                <div className="pt-1">
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Cambiar adaptador de red IP:
                  </label>
                  <select
                    value={selectedIpIndex}
                    onChange={(e) => setSelectedIpIndex(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded px-2 py-1 w-full"
                  >
                    {ips.map((ip, idx) => (
                      <option key={ip} value={idx}>
                        {ip}:{port}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Full URL badge & copy */}
              <div className="flex items-center gap-2 pt-1">
                <code className="flex-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 font-mono text-xs text-amber-300 truncate">
                  {fullMobileUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(fullMobileUrl, 'url')}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedType === 'url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedType === 'url' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Solución al Firewall de Windows */}
          <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <Shield className="text-amber-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-300 text-sm">
                  Superar el Firewall de Windows (Solución en 1 Clic)
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Por seguridad, Windows bloquea conexiones entrantes de otros dispositivos en el puerto {port}. Para permitir que tu celular se conecte, ejecuta este comando en la PC:
                </p>
              </div>
            </div>

            {/* PowerShell / CMD Command box */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Comando para PowerShell / CMD (Administrador):</span>
                <span className="text-[11px] text-zinc-500">Puerto {port} TCP Inbound</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                <code className="text-xs text-amber-200 font-mono flex-1 select-all break-all">
                  {netshCmd}
                </code>
                <button
                  onClick={() => copyToClipboard(netshCmd, 'firewall')}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-md text-xs font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow"
                >
                  {copiedType === 'firewall' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedType === 'firewall' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-amber-900/30">
              <div className="flex items-start gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Misma red Wi-Fi en PC y celular</span>
              </div>
              <div className="flex items-start gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Red configurada como "Privada" en Windows</span>
              </div>
              <div className="flex items-start gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Servidor corriendo en la PC (<code className="text-amber-300">node server.js</code>)</span>
              </div>
              <div className="flex items-start gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>OBS WebSocket activado en puerto 4455</span>
              </div>
            </div>
          </div>

          {/* PWA Mode Tip */}
          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3 text-xs text-zinc-400">
            <span className="text-2xl">📱</span>
            <div className="flex-1">
              <strong className="text-zinc-200 block mb-0.5">Tip: Modo Pantalla Completa (PWA)</strong>
              En Chrome móvil toca los tres puntos <span className="text-amber-300 font-bold">"Añadir a pantalla de inicio"</span> (o en Safari "Compartir &gt; Añadir a pantalla de inicio") para que funcione exactamente como una Stream Deck física sin barras del navegador.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/80">
          <button
            type="button"
            onClick={onRefreshIps}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold"
          >
            <RefreshCw size={14} /> Refrescar IPs
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
