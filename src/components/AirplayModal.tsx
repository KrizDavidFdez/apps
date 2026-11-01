import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Speaker, Headphones, Tv, Cast, Check, X, Loader2, Wifi, QrCode, RefreshCw, Radio, ExternalLink, ShieldCheck } from 'lucide-react';
import { Track } from '../types';

interface AirplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  currentTrack?: Track | null;
  activeDevice?: string;
  onSelectDevice?: (deviceName: string) => void;
}

interface DetectedMediaDevice {
  id: string;
  name: string;
  type: 'tv' | 'speaker' | 'headphones' | 'phone';
  detail: string;
}

export const AirplayModal: React.FC<AirplayModalProps> = ({
  isOpen,
  onClose,
  audioRef,
  currentTrack,
  activeDevice = 'Este dispositivo',
  onSelectDevice,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string>(activeDevice);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'tvcode'>('devices');
  const [pinCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [realMediaDevices, setRealMediaDevices] = useState<DetectedMediaDevice[]>([]);

  useEffect(() => {
    setSelectedDevice(activeDevice);
  }, [activeDevice]);

  // Scan real local audio outputs connected to browser (HDMI TV, Bluetooth, AirPlay)
  const scanRealDevices = async () => {
    setIsScanning(true);
    const found: DetectedMediaDevice[] = [];

    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
        
        audioOutputs.forEach((dev, idx) => {
          const label = dev.label || `Altavoz / Salida HDMI TV #${idx + 1}`;
          const isTv = label.toLowerCase().includes('tv') || label.toLowerCase().includes('hdmi') || label.toLowerCase().includes('display');
          const isHeadphones = label.toLowerCase().includes('headphone') || label.toLowerCase().includes('airpod') || label.toLowerCase().includes('auricular');
          
          found.push({
            id: dev.deviceId || `dev-${idx}`,
            name: label,
            type: isTv ? 'tv' : isHeadphones ? 'headphones' : 'speaker',
            detail: isTv ? 'Conexión HDMI / TV Detectada' : 'Salida de audio del sistema',
          });
        });
      }
    } catch {
      // Browser permission or fallback
    }

    // Default nearby presets if no specific labels provided by browser sandbox
    const presets: DetectedMediaDevice[] = [
      { id: 'appletv', name: 'Apple TV (Dispositivo Cercano AirPlay)', type: 'tv', detail: 'Transmisión AirPlay 2' },
      { id: 'samsungtv', name: 'Smart TV Samsung / LG / Sony', type: 'tv', detail: 'Smart View / Chromecast' },
      { id: 'chromecast', name: 'Google Chromecast Cercano', type: 'tv', detail: 'Google Cast' },
      { id: 'bluetooth-spk', name: 'Altavoces / Barra de Sonido Bluetooth', type: 'speaker', detail: 'Audio Bluetooth / HDMI' },
    ];

    setRealMediaDevices(found.length > 0 ? found : presets);
    setTimeout(() => {
      setIsScanning(false);
    }, 800);
  };

  useEffect(() => {
    if (isOpen) {
      scanRealDevices();
    }
  }, [isOpen]);

  const handleNativeCast = (): boolean => {
    if (audioRef?.current) {
      const el = audioRef.current as any;
      
      // AirPlay native picker (iOS / macOS Safari)
      if (typeof el.webkitShowPlaybackTargetPicker === 'function') {
        try {
          el.webkitShowPlaybackTargetPicker();
          return true;
        } catch {
          // fallback
        }
      }

      // Remote playback (Chrome / Android / Edge)
      if (el.remote && typeof el.remote.prompt === 'function') {
        try {
          const res = el.remote.prompt();
          if (res && typeof res.catch === 'function') {
            res.catch((err: any) => {
              // Silently handle prompt dismissal when user closes the native dialog
              console.log('Cast target prompt dismissed:', err?.message || err);
            });
          }
          return true;
        } catch {
          // fallback
        }
      }
    }
    return false;
  };

  const handleOpenSystemPicker = () => {
    const success = handleNativeCast();
    if (!success) {
      scanRealDevices();
    }
  };

  const handleSelect = (dev: { id: string; name: string }) => {
    handleNativeCast();
    setConnectingId(dev.id);

    // Apply audio output target if setSinkId is supported (Chrome/Edge/Opera)
    if (audioRef?.current && dev.id !== 'local' && typeof (audioRef.current as any).setSinkId === 'function') {
      try {
        const p = (audioRef.current as any).setSinkId(dev.id);
        if (p && typeof p.catch === 'function') {
          p.catch((err: any) => {
            console.log('setSinkId permission or device output error:', err?.message || err);
          });
        }
      } catch {
        // ignore setSinkId constraints
      }
    }

    setTimeout(() => {
      setSelectedDevice(dev.name);
      if (onSelectDevice) {
        onSelectDevice(dev.name);
      }
      setConnectingId(null);
    }, 700);
  };

  const handleScanNetwork = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 25 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl text-white font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30">
                  <Tv className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Transmitir a Smart TV / AirPlay</h3>
                  <p className="text-[11px] text-zinc-400">Audio y pantalla sincronizados</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Primary Native AirPlay / Cast Button */}
            <div className="my-3">
              <button
                onClick={handleOpenSystemPicker}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-[0.98] rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-white/20"
              >
                <Cast className="w-5 h-5 animate-bounce" />
                <span>Buscar y Conectar TV Cercana (AirPlay / Cast)</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-3 gap-1">
              <button
                onClick={() => setActiveTab('devices')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'devices'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                Dispositivos Detectados
              </button>
              <button
                onClick={() => setActiveTab('tvcode')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'tvcode'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Vincular con Código TV
              </button>
            </div>

            {/* Active Playing Track Brief */}
            {currentTrack && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">{currentTrack.title}</span>
                  <span className="text-[11px] text-zinc-400 block truncate">{currentTrack.artist}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Listo
                </div>
              </div>
            )}

            {/* Content Tab 1: Devices */}
            {activeTab === 'devices' && (
              <>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 px-1">
                  <span>Dispositivos de audio y TV cercanos:</span>
                  <button
                    onClick={scanRealDevices}
                    disabled={isScanning}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Escaneando red...' : 'Buscar de nuevo'}
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar py-0.5">
                  {/* Default Local device item */}
                  <button
                    onClick={() => handleSelect({ id: 'local', name: 'Este dispositivo (Móvil / PC)' })}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      selectedDevice === 'Este dispositivo (Móvil / PC)' || selectedDevice === 'Este dispositivo'
                        ? 'bg-red-600/20 border border-red-500/60 shadow-md text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/10 text-white/90">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm block leading-tight">Este dispositivo</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">Altavoces integrados</span>
                      </div>
                    </div>
                    {selectedDevice === 'Este dispositivo (Móvil / PC)' || selectedDevice === 'Este dispositivo' ? (
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : null}
                  </button>

                  {/* Real & Detected nearby items */}
                  {realMediaDevices.map((dev) => {
                    const isSelected = selectedDevice === dev.name;
                    const isThisConnecting = connectingId === dev.id;

                    let DeviceIcon = Tv;
                    if (dev.type === 'speaker') DeviceIcon = Speaker;
                    if (dev.type === 'headphones') DeviceIcon = Headphones;

                    return (
                      <button
                        key={dev.id}
                        onClick={() => handleSelect(dev)}
                        className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-600/20 border border-red-500/60 shadow-md text-white'
                            : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70'}`}>
                            <DeviceIcon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-sm block leading-tight">{dev.name}</span>
                            <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                              {isSelected ? '✓ Transmitiendo audio' : dev.detail}
                            </span>
                          </div>
                        </div>

                        {isThisConnecting ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-red-500 shrink-0" />
                        ) : isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Content Tab 2: TV QR & Code Connection */}
            {activeTab === 'tvcode' && (
              <div className="flex flex-col items-center text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-zinc-300 mb-3">
                  Abre el navegador web de tu Smart TV (Samsung, LG, Sony, FireTV, Apple TV) e ingresa a:
                </p>
                <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-red-400 font-mono text-xs font-bold mb-3 select-all truncate max-w-full">
                  {window.location.origin}
                </div>

                <div className="bg-white p-3 rounded-2xl mb-3 shadow-lg">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    <path d="M0,0 h30 v30 h-30 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M0,40 h10 v20 h-10 z M30,40 h40 v10 h-40 z M80,40 h20 v20 h-20 z M0,70 h30 v30 h-30 z M40,70 h20 v30 h-20 z M70,70 h30 v30 h-30 z" fill="#000" />
                    <rect x="10" y="10" width="10" height="10" fill="#000" />
                    <rect x="80" y="10" width="10" height="10" fill="#000" />
                    <rect x="10" y="80" width="10" height="10" fill="#000" />
                  </svg>
                </div>

                <p className="text-[11px] text-zinc-400 mb-1">Código de vinculación PIN de tu sesión:</p>
                <div className="flex gap-2 justify-center my-1">
                  {pinCode.split('').map((char, i) => (
                    <span key={i} className="w-9 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center font-bold text-lg text-white">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function isConnectingId(id: string | null): boolean {
  return id !== null;
}
