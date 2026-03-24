import { CronManager } from './cron';

async function main() {
  const manager = new CronManager();
  console.log('🚀 Lumina Cron Service starting...');
  await manager.init();
  
  // Keep the process alive
  // node-cron tasks will keep the event loop alive, but we can also handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Cron Service...');
    manager.stopAll();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating Cron Service...');
    manager.stopAll();
    process.exit(0);
  });
}

main().catch(err => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Service Error:', message);
  process.exit(1);
});
