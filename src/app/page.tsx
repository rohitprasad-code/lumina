import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black p-6">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl px-4">
        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold tracking-tighter text-black dark:text-white sm:text-7xl">
            Lumina
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
            AI-Powered Environment Control
          </p>
        </div>
        
        <Link 
          href="/dashboard"
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-900 dark:bg-white px-8 py-4 font-medium text-white dark:text-black transition-all hover:scale-105 active:scale-95"
        >
          <span>Enter Dashboard</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-white opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </main>
    </div>
  );
}
