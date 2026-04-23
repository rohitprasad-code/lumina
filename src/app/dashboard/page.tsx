"use client";

import React, { useState } from "react";
import { DeviceCard } from "@/components/ui/DeviceCard";
import { motion } from "framer-motion";

const MOCK_DEVICES = [
  { id: "1", name: "Living Room Light", type: "bulb" as const, isOn: true, brightness: 80 },
  { id: "2", name: "Bedroom Light", type: "bulb" as const, isOn: false, brightness: 50 },
  { id: "3", name: "Kitchen LED", type: "bulb" as const, isOn: true, brightness: 100 },
  { id: "4", name: "Office Fan", type: "fan" as const, isOn: false },
];

export default function DashboardPage() {
  const [devices, setDevices] = useState(MOCK_DEVICES);

  const handleToggle = (id: string, currentState: boolean) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isOn: !currentState } : d))
    );
  };

  const handleBrightnessChange = (id: string, value: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, brightness: value } : d))
    );
  };

  const activeCount = devices.filter((d) => d.isOn).length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          Overview
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-500 dark:text-zinc-400 text-lg"
        >
          {activeCount} device{activeCount !== 1 ? 's' : ''} currently active.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device, i) => (
          <DeviceCard
            key={device.id}
            {...device}
            onToggle={handleToggle}
            onBrightnessChange={handleBrightnessChange}
          />
        ))}
      </div>
    </div>
  );
}
