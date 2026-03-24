import cron, { ScheduledTask } from "node-cron";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { executeTool } from "../model/tools/executor";
import { CONFIG_DIR } from "../util/paths";

interface AutomationAction {
  tool: string;
  arguments: any;
}

interface Automation {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  actions: AutomationAction[];
}

export class CronManager {
  private configPath: string;
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.configPath = join(CONFIG_DIR, "automations.json");
  }

  public async init(): Promise<void> {
    if (!existsSync(this.configPath)) {
      console.warn(`⚠️ No automations file found at ${this.configPath}`);
      return;
    }

    try {
      const data = JSON.parse(
        readFileSync(this.configPath, "utf-8"),
      ) as Automation[];
      for (const automation of data) {
        if (automation.enabled) {
          this.schedule(automation);
        }
      }

      console.log(`✅ Loaded ${this.tasks.size} automations.`);
    } catch (error: any) {
      console.error(`❌ Failed to load automations: ${error.message}`);
    }
  }

  private schedule(automation: Automation): void {
    const task = cron.schedule(automation.cron, async () => {
      console.log(
        `⏰ Executing automation: ${automation.name} (${automation.id})`,
      );

      for (const action of automation.actions) {
        try {
          // Construct a dummy ToolCall object for the executor
          const toolCall = {
            function: {
              name: action.tool,
              arguments: action.arguments,
            },
          };

          const result = await executeTool(toolCall as any);
          console.log(`   - Result (${action.tool}):`, result);
        } catch (error: any) {
          console.error(`   - Error (${action.tool}):`, error.message);
        }
      }
    });

    this.tasks.set(automation.id, task);
  }
}
