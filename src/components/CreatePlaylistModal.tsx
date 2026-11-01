import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string, coverUrl?: string) => void;
  onCreatePlaylist?: (name: string, coverUrl?: string) => void;
  isDark?: boolean;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onCreatePlaylist,
  isDark = true,
}) => {
  const [name, setName] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setCoverUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const createFn = onCreate || onCreatePlaylist;
    if (typeof createFn === 'function') {
      createFn(name.trim(), coverUrl || undefined);
    }
    setName('');
    setCoverUrl('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl overflow-hidden ${
            isDark ? 'bg-zinc-950 border-white/10 text-white' : 'bg-white border-black/10 text-black'
          }`}
        >
          {/* Modal Header */}
          <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <h3 className="font-sf-bold text-lg tracking-tight">Nueva Playlist</h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
            {/* Cover image preview & picker */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all shadow-md ${
                  isDark
                    ? 'bg-zinc-900 border-white/20 hover:border-white'
                    : 'bg-zinc-100 border-black/20 hover:border-black'
                }`}
              >
                {coverUrl ? (
                  <>
                    <img
                      src={coverUrl}
                      alt="Preview"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs font-sf-bold">Cambiar imagen</span>
                    </div>
                  </>
                ) : (
                  <div className={`flex flex-col items-center transition-colors p-3 text-center ${
                    isDark ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-black'
                  }`}>
                    <ImageIcon className="w-8 h-8 mb-1.5" />
                    <span className="text-xs font-sf-bold">Subir imagen</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Opcional (click aquí)</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="text-xs text-zinc-500 hover:underline cursor-pointer"
                >
                  Quitar imagen seleccionada
                </button>
              )}
            </div>

            {/* Playlist Title */}
            <div>
              <label className="block text-xs font-sf-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nombre de la playlist
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Mis Éxitos, Entreno, Relax..."
                required
                autoFocus
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-900 border-white/10 text-white focus:border-white placeholder:text-zinc-500'
                    : 'bg-zinc-100 border-black/10 text-black focus:border-black placeholder:text-zinc-400'
                }`}
              />
            </div>

            {/* Custom URL mode toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
                className={`text-[11px] font-medium hover:underline cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                }`}
              >
                {isCustomUrlMode ? 'Ocultar URL de imagen' : '¿Prefieres pegar un enlace de imagen (URL)?'}
              </button>
              {isCustomUrlMode && (
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className={`w-full mt-1.5 px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark
                      ? 'bg-zinc-900 border-white/10 text-white focus:border-white'
                      : 'bg-zinc-100 border-black/10 text-black focus:border-black'
                  }`}
                />
              )}
            </div>

            {/* Submit button (Black & White Theme) */}
            <button
              type="submit"
              disabled={!name.trim()}
              className={`w-full py-3 rounded-xl disabled:opacity-40 font-sf-bold text-sm shadow-md transition-all cursor-pointer mt-1 ${
                isDark
                  ? 'bg-white hover:bg-zinc-200 text-black'
                  : 'bg-black hover:bg-zinc-800 text-white'
              }`}
            >
              Crear Playlist
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
