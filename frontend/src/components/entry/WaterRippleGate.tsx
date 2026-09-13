"use client";

import React, { useEffect, useRef, useState } from "react";
import { Droplets, Volume2, VolumeX, Shield, Play } from "lucide-react";

interface WaterRippleGateProps {
  onOpen: () => void;
}

export const WaterRippleGate: React.FC<WaterRippleGateProps> = ({ onOpen }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic cinematic sound
  const playOpenSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Sub-bass sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio skipped:", e);
    }
  };

  // Simulate Percentage Loader (0% -> 100%)
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 3;
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        clearInterval(interval);
        setTimeout(() => setIsLoaded(true), 400);
      } else {
        setLoadingProgress(progress);
      }
    }, 28);

    return () => clearInterval(interval);
  }, []);

  // Canvas Water Ripple Simulation
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const ripples: { x: number; y: number; radius: number; maxRadius: number; opacity: number; speed: number }[] = [];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 1,
        maxRadius: Math.random() * 70 + 60,
        opacity: 0.6,
        speed: Math.random() * 2 + 1.5,
      });
      if (ripples.length > 25) ripples.shift();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.65) {
        addRipple(e.clientX, e.clientY);
      }
    };

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => addRipple(e.clientX + (Math.random() * 20 - 10), e.clientY + (Math.random() * 20 - 10)), i * 80);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    // Seed periodic ambient center drops
    const dropInterval = setInterval(() => {
      addRipple(width / 2 + (Math.random() * 200 - 100), height / 2 + (Math.random() * 150 - 75));
    }, 2500);

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Ambient radial dark gradient
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.4);
      grad.addColorStop(0, "rgba(18, 22, 32, 0.4)");
      grad.addColorStop(1, "rgba(8, 10, 14, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.opacity *= 0.965;

        if (r.opacity < 0.01 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${r.opacity * 0.45})`;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Inner secondary ring
        if (r.radius > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(112, 89, 226, ${r.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(dropInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [isLoaded]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    playOpenSound();
    setIsExiting(true);
    setTimeout(() => {
      onOpen();
    }, 850);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090d] text-white transition-all duration-700 ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. Loading Phase */}
      {!isLoaded && (
        <div className="flex flex-col items-center justify-center text-center p-6 select-none">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(0,229,255,0.25)]">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>

          <h1 className="font-brand text-2xl md:text-3xl font-bold tracking-[0.6em] text-neutral-200 uppercase pl-[0.6em] mb-2">
            ORCUS
          </h1>
          <p className="font-mono-code text-xs text-neutral-500 tracking-[0.35em] uppercase mb-8">
            Investigation &amp; Case Tracking System
          </p>

          {/* Progress Bar */}
          <div className="w-64 h-[2px] bg-neutral-800 rounded-full overflow-hidden relative mb-3">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_#00e5ff] transition-all duration-75"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <span className="font-mono-code text-xs text-neutral-400 tracking-widest">
            INITIALIZING CORE ENGINE &bull; {loadingProgress}%
          </span>
        </div>
      )}

      {/* 2. Start / Click to Open Phase with Water Ripples */}
      {isLoaded && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

          {/* Audio toggle in top right */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/60 backdrop-blur-md text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? "AUDIO ON" : "MUTED"}</span>
          </button>

          {/* Center Brand & Start Button */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 select-none max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-[11px] font-mono tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              DBMS Master Project &bull; Summer 2026
            </div>

            <h1 className="font-brand text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.5em] text-white pl-[0.5em] mb-4 text-shadow-glow">
              ORCUS
            </h1>

            <p className="font-tactical text-xs sm:text-sm text-neutral-400 tracking-[0.35em] uppercase mb-12">
              Police Investigation &amp; Criminal Intelligence Network
            </p>

            {/* Glowing Start Button */}
            <button
              onClick={handleStart}
              className="group relative px-10 py-4 rounded-full border border-white/20 bg-neutral-900/80 backdrop-blur-xl text-neutral-200 font-tactical text-sm sm:text-base font-semibold tracking-[0.35em] uppercase transition-all duration-300 hover:text-white hover:border-cyan-400 hover:scale-105 hover:shadow-[0_0_35px_rgba(0,229,255,0.4)] active:scale-95"
            >
              <span className="flex items-center gap-3">
                <span>START &bull; OPEN</span>
                <Play className="w-4 h-4 fill-current text-cyan-400 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Hint */}
            <div className="mt-14 flex items-center gap-2 text-neutral-500 text-xs font-mono tracking-widest">
              <Droplets className="w-3.5 h-3.5 text-cyan-500/70 animate-bounce" />
              <span>MOVE CURSOR OR CLICK FOR WATER RIPPLES</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
