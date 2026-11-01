import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
  onReset: () => void;
}

const PRESET_TOP_COLORS = [
  { name: 'Carbón', value: '#2e2e2e' },
  { name: 'Negro Puro', value: '#121212' },
  { name: 'Medianoche', value: '#1a1e29' },
  { name: 'Vino Oscuro', value: '#2b1b22' },
  { name: 'Café Profundo', value: '#26201e' },
];

const PRESET_BOTTOM_COLORS = [
  { name: 'Gris Claro', value: '#e8eaee' },
  { name: 'Blanco Nieve', value: '#f8fafc' },
  { name: 'Crema Cálido', value: '#f4ece2' },
  { name: 'Gris Grafito', value: '#d1d5db' },
  { name: 'Oscuro Suave', value: '#374151' },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange,
  onReset,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-white/15 rounded-3xl p-6 shadow-2xl text-white z-10 select-none flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Personalizar Colores</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Section Color */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Color Superior (Cabecera & Tarjetas)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={topColor}
                    onChange={(e) => onTopColorChange(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 outline-none"
                    title="Elegir color personalizado"
                  />
                  <span className="font-mono text-[11px] text-zinc-400">{topColor}</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {PRESET_TOP_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onTopColorChange(preset.value)}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    className={`flex-1 h-9 rounded-xl border transition-all ${
                      topColor.toLowerCase() === preset.value.toLowerCase()
                        ? 'border-white ring-2 ring-white/50 scale-105'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Section Color */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Color Inferior (Lista de canciones)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={bottomColor}
                    onChange={(e) => onBottomColorChange(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 outline-none"
                    title="Elegir color personalizado"
                  />
                  <span className="font-mono text-[11px] text-zinc-400">{bottomColor}</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {PRESET_BOTTOM_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onBottomColorChange(preset.value)}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    className={`flex-1 h-9 rounded-xl border transition-all ${
                      bottomColor.toLowerCase() === preset.value.toLowerCase()
                        ? 'border-black/50 ring-2 ring-white scale-105'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Live Preview Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium">Vista previa de contraste</span>
              <div className="w-full h-10 rounded-2xl overflow-hidden flex border border-white/15 shadow-inner">
                <div
                  style={{ backgroundColor: topColor }}
                  className="flex-1 flex items-center justify-center text-[10px] font-bold text-white"
                >
                  Superior
                </div>
                <div
                  style={{ backgroundColor: bottomColor }}
                  className="flex-1 flex items-center justify-center text-[10px] font-bold text-zinc-800"
                >
                  Inferior
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white text-zinc-900 font-bold text-xs rounded-xl hover:bg-zinc-200 active:scale-95 transition-all shadow-md"
              >
                Listo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
