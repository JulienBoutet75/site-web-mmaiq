import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Scissors, RotateCcw, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Cut {
  start: number;
  end: number;
}

export function VideoEditorModal({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [markIn, setMarkIn] = useState<number | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Enforce trim
    if (time < trimStart) {
      videoRef.current.currentTime = trimStart;
    } else if (time >= trimEnd) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Enforce cuts
    for (const cut of cuts) {
      if (time >= cut.start && time < cut.end) {
        videoRef.current.currentTime = cut.end;
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMarkCut = () => {
    if (markIn === null) {
      setMarkIn(currentTime);
    } else {
      // Ensure start < end
      const start = Math.min(markIn, currentTime);
      const end = Math.max(markIn, currentTime);
      setCuts([...cuts, { start, end }]);
      setMarkIn(null);
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const calculateFinalDuration = () => {
    let totalCut = 0;
    cuts.forEach(c => totalCut += (c.end - c.start));
    return (trimEnd - trimStart) - totalCut;
  };

  const copyPlan = () => {
    const plan = {
      video: videoUrl.split('/').pop(),
      trimStart,
      trimEnd,
      cuts
    };
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    // alert("Plan de coupe copié !");
  };

  return (
    <div className="fixed inset-0 z-[10001] bg-[#06060e] flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-[#1e1e34] flex items-center justify-between px-6 shrink-0">
        <h2 className="text-white font-days-one text-lg truncate flex-1 mr-4">
          Éditeur Vidéo <span className="text-gray-500 font-bai-jamjuree text-sm ml-2">{videoUrl.split('/').pop()}</span>
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center max-w-5xl mx-auto w-full gap-6">
        
        {/* Player */}
        <div className="w-full bg-black rounded-2xl overflow-hidden border border-[#1e1e34] shadow-2xl relative flex items-center justify-center min-h-[300px]">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-[60vh] object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between bg-[#111120] p-4 rounded-xl border border-[#1e1e34]">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-purple-500/20">
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkCut}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  markIn !== null 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Scissors size={18} />
                {markIn !== null ? `Point OUT (IN: ${formatTime(markIn)})` : 'Marquer coupe'}
              </button>
              
              {markIn !== null && (
                <button onClick={() => setMarkIn(null)} className="text-sm text-gray-500 hover:text-white px-3 py-2">
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className="font-mono text-xl text-white tracking-wider">
            {formatTime(currentTime)} <span className="text-gray-500 text-sm">/ {formatTime(duration)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="w-full relative h-12 bg-[#111120] rounded-lg border border-[#1e1e34] cursor-pointer overflow-hidden" onClick={handleSeek}>
          {/* Trim Overlay Left */}
          <div className="absolute top-0 bottom-0 left-0 bg-black/60 z-10" style={{ width: `${(trimStart / duration) * 100}%` }} />
          {/* Trim Overlay Right */}
          <div className="absolute top-0 bottom-0 right-0 bg-black/60 z-10" style={{ width: `${(1 - trimEnd / duration) * 100}%` }} />
          
          {/* Cuts Overlay */}
          {cuts.map((cut, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 bg-red-500/30 border-x border-red-500 z-10"
              style={{
                left: `${(cut.start / duration) * 100}%`,
                width: `${((cut.end - cut.start) / duration) * 100}%`
              }}
            />
          ))}

          {/* Mark IN Line */}
          {markIn !== null && (
            <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500 z-20" style={{ left: `${(markIn / duration) * 100}%` }} />
          )}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-purple-500 z-30 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(160,32,240,0.8)]" />
          </div>
        </div>

        {/* Trims */}
        <div className="w-full grid grid-cols-2 gap-6">
          {/* Trim Start */}
          <div className="bg-[#111120] p-4 rounded-xl border border-[#1e1e34]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Trim début</label>
              <span className="font-mono text-xs text-purple-400">{formatTime(trimStart)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trimStart}
              onChange={(e) => setTrimStart(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <button
              onClick={() => setTrimStart(currentTime)}
              className="mt-2 text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded"
            >
              Définir ici
            </button>
          </div>

          {/* Trim End */}
          <div className="bg-[#111120] p-4 rounded-xl border border-[#1e1e34]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Trim fin</label>
              <span className="font-mono text-xs text-purple-400">{formatTime(trimEnd)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trimEnd}
              onChange={(e) => setTrimEnd(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <button
              onClick={() => setTrimEnd(currentTime)}
              className="mt-2 text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded"
            >
              Définir ici
            </button>
          </div>
        </div>

        {/* Cuts List & Summary */}
        <div className="w-full grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#111120] p-4 rounded-xl border border-[#1e1e34]">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Zones coupées ({cuts.length})</h3>
            {cuts.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune coupe définie.</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {cuts.map((cut, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
                      <Scissors size={14} className="text-red-400" />
                      {formatTime(cut.start)} → {formatTime(cut.end)}
                      <span className="text-gray-500 text-xs ml-2">({formatTime(cut.end - cut.start)} suppr.)</span>
                    </div>
                    <button
                      onClick={() => setCuts(cuts.filter((_, index) => index !== i))}
                      className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition-colors"
                    >
                      <RotateCcw size={12} /> Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-300 mb-3">Résumé</h3>
              <ul className="space-y-1 text-sm text-gray-300 font-mono">
                <li>Original : {formatTime(duration)}</li>
                <li>Trim : {formatTime(trimStart)} → {formatTime(trimEnd)}</li>
                <li>Coupes : {cuts.length}</li>
              </ul>
              <div className="mt-4 pt-3 border-t border-purple-500/20">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Durée finale estimée</span>
                <p className="text-2xl font-bold text-green-400 font-mono mt-1">{formatTime(calculateFinalDuration())}</p>
              </div>
            </div>
            <button
              onClick={copyPlan}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Copy size={16} /> Copier plan (JSON)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
