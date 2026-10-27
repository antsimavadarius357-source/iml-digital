import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HandMetal, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import handsReachingImg from '../../assets/hands_reaching.jpg';
import handsClaspedImg from '../../assets/hands_clasped.jpg';
import originalHandsImg from '../../assets/hands_clasp_partnership.png';

export const AnimatedHandshakeHero: React.FC = () => {
  // Animation states: 'detached' -> 'approaching' -> 'clasped' -> 'detaching'
  const [animPhase, setAnimPhase] = useState<'detached' | 'approaching' | 'clasped' | 'detaching'>('detached');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [useOriginalVisual, setUseOriginalVisual] = useState<boolean>(false);
  const [claspTriggerCount, setClaspTriggerCount] = useState<number>(0);

  // Automated animation loop demonstrating the detachment and greeting (se détacher & se saluer)
  useEffect(() => {
    if (!isAutoPlaying) return;

    let timer: ReturnType<typeof setTimeout>;

    if (animPhase === 'detached') {
      // Stay detached for 1.8s so user clearly sees the hands apart
      timer = setTimeout(() => {
        setAnimPhase('approaching');
      }, 1800);
    } else if (animPhase === 'approaching') {
      // Approach duration 0.9s before firm handshake clasp
      timer = setTimeout(() => {
        setAnimPhase('clasped');
        setClaspTriggerCount((c) => c + 1);
      }, 900);
    } else if (animPhase === 'clasped') {
      // Hold the firm handshake & alliance for 3.2s
      timer = setTimeout(() => {
        setAnimPhase('detaching');
      }, 3200);
    } else if (animPhase === 'detaching') {
      // Detachment sliding motion takes 1.1s
      timer = setTimeout(() => {
        setAnimPhase('detached');
      }, 1100);
    }

    return () => clearTimeout(timer);
  }, [animPhase, isAutoPlaying]);

  const handleManualClasp = () => {
    if (animPhase === 'clasped') {
      setAnimPhase('detaching');
    } else {
      setAnimPhase('approaching');
    }
  };

  const isLocked = animPhase === 'clasped';
  const isDetached = animPhase === 'detached';

  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none">
      {/* Outer Glow Halo & Africa Neon Graphic Backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#38d9a9]/20 via-amber-500/10 to-[#14233c]/60 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      {/* Main Showcase Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-b from-[#101c30] via-[#0d1728] to-[#0a1220] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
        
        {/* Stylized African Continent Map SVG Silhouette (echoing reference image) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 flex items-center justify-center">
          <svg
            viewBox="0 0 400 450"
            className="w-[90%] h-[90%] stroke-cyan-400/40 fill-cyan-500/5 stroke-[1.5]"
            style={{ filter: 'drop-shadow(0 0 12px rgba(56, 217, 169, 0.25))' }}
          >
            {/* Outline of African Continent */}
            <path d="M190,40 C230,42 270,55 295,85 C315,110 330,135 340,165 C345,180 342,195 330,205 C310,220 305,235 300,260 C290,300 270,350 240,390 C225,410 215,415 205,395 C190,360 175,320 170,290 C165,260 155,245 140,240 C110,230 85,210 75,185 C65,160 70,140 95,120 C110,105 130,90 145,70 C160,50 175,42 190,40 Z" />
            {/* Subtle Latitude/Longitude connection arcs */}
            <path d="M80,180 Q200,220 340,170" fill="none" stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="4 4" />
            <path d="M120,280 Q210,300 280,340" fill="none" stroke="rgba(56, 217, 169, 0.3)" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Dynamic State Header Banner */}
        <div className="relative z-20 flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLocked ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLocked ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {animPhase === 'detached' && 'Mains détachées • En phase d\'approche'}
              {animPhase === 'approaching' && 'Viennent se saluer...'}
              {animPhase === 'clasped' && 'Alliance scellée • Poignée de main unie'}
              {animPhase === 'detaching' && 'Séparation pour nouveau cycle...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUseOriginalVisual(!useOriginalVisual)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition"
              title="Basculer vers la capture de référence"
            >
              {useOriginalVisual ? '✨ Version Studio' : '🖼️ Image de Référence'}
            </button>
          </div>
        </div>

        {/* Visual Animation Stage */}
        <div className="relative aspect-square sm:h-[460px] w-full overflow-hidden flex items-center justify-center bg-slate-950">
          
          {/* OPTION A: Original User Uploaded Visual (if toggled) */}
          {useOriginalVisual ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={originalHandsImg}
                alt="Partenariat Ideation Axis - mains qui se saluent"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            </motion.div>
          ) : (
            /* OPTION B: Fully Animated Detached & Clasping Hands */
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* Layer 1: Reaching / Detached State Image */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{
                  opacity: animPhase === 'detached' || animPhase === 'detaching' ? 1 : animPhase === 'approaching' ? 0.35 : 0,
                  scale: isDetached ? 1.05 : 1,
                }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              >
                <img
                  src={handsReachingImg}
                  alt="Mains de l'entrepreneur et du mentor qui se cherchent et se saluent"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Layer 2: Firm Locked Handshake Clasp Image */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{
                  opacity: isLocked ? 1 : animPhase === 'approaching' ? 0.65 : 0,
                  scale: isLocked ? [1.02, 1, 1.01] : 0.98,
                }}
                transition={{
                  opacity: { duration: 0.6, ease: 'easeOut' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <img
                  src={handsClaspedImg}
                  alt="Poignée de main puissante scellant le partenariat d'accompagnement"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Physical Animated Hand Elements simulating separation and greeting */}
              {/* Top Arm (Mentor / Partenaire descendant vers le centre) */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ top: '12%', right: '12%', width: '45%', height: '45%' }}
                animate={{
                  x: animPhase === 'detached' ? 28 : animPhase === 'approaching' ? [28, 0] : animPhase === 'detaching' ? [0, 28] : 0,
                  y: animPhase === 'detached' ? -28 : animPhase === 'approaching' ? [-28, 0] : animPhase === 'detaching' ? [0, -28] : 0,
                  rotate: animPhase === 'detached' ? 4 : 0,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Visual marker label on top arm */}
                <motion.div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 shadow-lg backdrop-blur-sm"
                  animate={{ opacity: isDetached ? 0.9 : 0.4 }}
                >
                  <span>Mentor / Incubateur</span>
                </motion.div>
              </motion.div>

              {/* Bottom Arm (Porteur de projet / Entrepreneur montant vers le centre) */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ bottom: '12%', left: '12%', width: '45%', height: '45%' }}
                animate={{
                  x: animPhase === 'detached' ? -28 : animPhase === 'approaching' ? [-28, 0] : animPhase === 'detaching' ? [0, -28] : 0,
                  y: animPhase === 'detached' ? 28 : animPhase === 'approaching' ? [28, 0] : animPhase === 'detaching' ? [0, 28] : 0,
                  rotate: animPhase === 'detached' ? -4 : 0,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Visual marker label on bottom arm */}
                <motion.div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 text-[#38d9a9] text-[10px] font-bold border border-[#38d9a9]/30 shadow-lg backdrop-blur-sm"
                  animate={{ opacity: isDetached ? 0.9 : 0.4 }}
                >
                  <span>Porteur de Projet Gabonais</span>
                </motion.div>
              </motion.div>

              {/* Connection Shockwave & Flash at Handshake Clasp Point */}
              <AnimatePresence>
                {isLocked && (
                  <>
                    {/* Golden/Emerald Radiant Pulse */}
                    <motion.div
                      key={`ring-1-${claspTriggerCount}`}
                      className="absolute rounded-full border-2 border-amber-400/80 pointer-events-none"
                      style={{
                        top: '48%',
                        left: '49%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ width: 10, height: 10, opacity: 1 }}
                      animate={{ width: 220, height: 220, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                    />
                    <motion.div
                      key={`ring-2-${claspTriggerCount}`}
                      className="absolute rounded-full border-2 border-[#38d9a9] pointer-events-none"
                      style={{
                        top: '48%',
                        left: '49%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ width: 10, height: 10, opacity: 0.9 }}
                      animate={{ width: 160, height: 160, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.08 }}
                    />

                    {/* Central Energy Sparkle */}
                    <motion.div
                      key={`spark-${claspTriggerCount}`}
                      className="absolute w-12 h-12 bg-gradient-to-r from-amber-300 via-white to-[#38d9a9] rounded-full blur-md pointer-events-none"
                      style={{
                        top: '48%',
                        left: '49%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0.2, opacity: 1 }}
                      animate={{ scale: [0.2, 1.8, 0.4], opacity: [1, 0.7, 0] }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Vector Greeting Arc connecting the two hands */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
                <motion.path
                  d="M140,380 C 200,320 280,240 370,140"
                  fill="none"
                  stroke={isLocked ? '#38d9a9' : 'rgba(245, 158, 11, 0.4)'}
                  strokeWidth={isLocked ? '2' : '1.5'}
                  strokeDasharray={isLocked ? '0' : '6 6'}
                  animate={{
                    opacity: isLocked ? [0.4, 0.8, 0.4] : 0.3,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </svg>

              {/* Floating Badge 1: Mentorat & Confiance (Top Left) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 z-10"
              >
                <div className="size-7 rounded-xl bg-gradient-to-br from-[#f06553] to-amber-500 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Synergie PME & Incubateur</div>
                  <div className="text-[10px] text-slate-400">Co-construction & Suivi</div>
                </div>
              </motion.div>

              {/* Floating Badge 2: Objectif Clé (Bottom Right) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: isLocked ? [0, -4, 0] : 0,
                }}
                transition={{
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-10"
              >
                <div className="size-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-300">100% de Cohésion</div>
                  <div className="text-[10px] text-slate-300">Validation des jalons clés</div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Interactive Controls Bar: Allows user to see and control the greeting/detaching */}
        <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualClasp}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
              }`}
            >
              {isLocked ? (
                <>
                  <RefreshCw className="size-3.5" />
                  Détacher les mains
                </>
              ) : (
                <>
                  <HandMetal className="size-3.5" />
                  Se saluer maintenant 🤝
                </>
              )}
            </button>

            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                isAutoPlaying
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40'
              }`}
              title={isAutoPlaying ? 'Mettre en pause la boucle automatique' : 'Activer la boucle automatique'}
            >
              {isAutoPlaying ? 'Pause boucle' : '▶ Reprendre boucle'}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" />
            <span>Animation vivante du salut d'alliance</span>
          </div>
        </div>

      </div>
    </div>
  );
};
