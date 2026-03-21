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
      </main>
    </div>
  );
}
