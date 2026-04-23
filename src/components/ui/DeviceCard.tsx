"use client";

import React from "react";
import { motion } from "framer-motion";
import { Power } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// utility for classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeviceCardProps {
  id: string;
  name: string;
  type: "bulb" | "fan" | "outlet" | "sensor";
  isOn: boolean;
  brightness?: number;
  color?: string;
  onToggle: (id: string, currentState: boolean) => void;
  onBrightnessChange?: (id: string, value: number) => void;
}

export function DeviceCard({
  id,
  name,
  type,
  isOn,
  brightness,
  color,
  onToggle,
  onBrightnessChange,
}: DeviceCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 flex flex-col gap-6",
        "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-sm transition-colors",
        isOn && "bg-white/80 dark:bg-zinc-900/80 shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
              isOn
                ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {/* simple icon logic */}
            {type === "bulb" && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            )}
            {type === "fan" && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isOn ? "animate-spin-slow" : ""}><path d="M12 12V8l4.5-4.5a1.5 1.5 0 0 1 2.12 2.12l-4.5 4.5H16l4.5 4.5a1.5 1.5 0 0 1-2.12 2.12l-4.5-4.5v4l-4.5 4.5a1.5 1.5 0 0 1-2.12-2.12l4.5-4.5H8L3.5 11.5A1.5 1.5 0 0 1 5.62 9.38l4.5 4.5Z"/></svg>
            )}
            {type !== "bulb" && type !== "fan" && <Power className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg leading-tight">
              {name}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              {isOn ? "On" : "Off"} {brightness && isOn && `• ${brightness}%`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggle(id, isOn)}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            isOn
              ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg hover:scale-105 active:scale-95"
              : "bg-zinc-100 text-zinc-400 hover:text-zinc-900 dark:bg-zinc-800 dark:hover:text-white dark:text-zinc-500 hover:scale-105 active:scale-95"
          )}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      {/* Control section (Brightness) */}
      {brightness !== undefined && (
        <div className="pt-2">
          <input
            type="range"
            min="1"
            max="100"
            value={brightness}
            onChange={(e) => onBrightnessChange?.(id, parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
            disabled={!isOn}
          />
        </div>
      )}
    </motion.div>
  );
}
