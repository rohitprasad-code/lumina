import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { CONFIG_DIR } from '../util/paths';

export interface TuyaDevice {
  name: string;
  id: string;
  key: string;
  mac: string;
  uuid: string;
  sn?: string;
  category: string;
  product_name: string;
  product_id: string;
  biz_type: number;
  model: string;
  sub: boolean;
  ip: string;
  version: string;
  // Let mapping be an arbitrary object for now to avoid bloated typings
  mapping?: Record<string, unknown>;
}

export class DeviceRegistry {
  private devices: TuyaDevice[] = [];
  private static instance: DeviceRegistry;

  private constructor() {
    this.loadDevices();
  }

  public static getInstance(): DeviceRegistry {
    if (!DeviceRegistry.instance) {
      DeviceRegistry.instance = new DeviceRegistry();
    }
    return DeviceRegistry.instance;
  }

  private loadDevices() {
    const devicesPath = join(CONFIG_DIR, 'devices.json');
    if (!existsSync(devicesPath)) {
      console.warn('⚠️ devices.json not found in config directory. You may need to run scan first.');
      return;
    }

    try {
      const data = readFileSync(devicesPath, 'utf8');
      this.devices = JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to parse devices.json:', error);
    }
  }

  public getAllDevices(): TuyaDevice[] {
    return this.devices;
  }

  public getDeviceByIdOrName(identifier: string): TuyaDevice | undefined {
    // Exact match for id first
    let device = this.devices.find((d) => d.id === identifier);
    if (device) return device;

    // Direct match for name (case-insensitive)
    const lowerId = identifier.toLowerCase();
    device = this.devices.find((d) => d.name.toLowerCase() === lowerId);
    if (device) return device;

    // Partial match for name
    device = this.devices.find((d) => d.name.toLowerCase().includes(lowerId));
    return device;
  }

  public getDevicesByType(type: string): TuyaDevice[] {
    const lowerType = type.toLowerCase();
    // A rudimentary check based on name/category to group devices if you specify e.g. "bulb"
    return this.devices.filter((d) => {
      // Common Tuya Categories: 
      // dj = smart bulb, cz = smart plug, fs = fan
      // We can also just search the product_name for keywords
      const matchesCategory = 
        (lowerType === 'bulb' && d.category === 'dj') ||
        (lowerType === 'plug' && d.category === 'cz') ||
        (lowerType === 'fan' && d.category === 'fs');

      const matchesName = d.product_name.toLowerCase().includes(lowerType) || d.name.toLowerCase().includes(lowerType);
      
      return matchesCategory || matchesName;
    });
  }
}

// Export a singleton instance by default for easy usage
export const registry = DeviceRegistry.getInstance();
