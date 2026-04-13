import { select, confirm } from '@inquirer/prompts';
import { registry, TuyaDevice } from '../service/registry';

/**
 * When a global action is invoked but the target is ambiguous,
 * prompt the user to clarify.
 */
export async function resolveGlobalConflict(action: string): Promise<{ type: 'all' } | { type: 'category'; category: string } | { type: 'device'; deviceId: string } | null> {
  const answer = await select({
    message: `You issued a global '${action}'. Which devices should this apply to?`,
    choices: [
      { name: `All Devices`, value: 'all' },
      { name: `All Bulbs`, value: 'bulb' },
      { name: `All Fans`, value: 'fan' },
      { name: `All Plugs`, value: 'plug' },
      { name: `Select a Specific Device...`, value: 'specific' },
      { name: `Cancel`, value: 'cancel' }
    ],
  });

  if (answer === 'cancel') {
    console.log('Action cancelled.');
    return null;
  }

  if (answer === 'all') {
    const isSure = await confirm({ message: `Are you sure you want to apply '${action}' to EVERY device?` });
    if (!isSure) return null;
    return { type: 'all' };
  }

  if (answer === 'bulb' || answer === 'fan' || answer === 'plug') {
    return { type: 'category', category: answer };
  }

  if (answer === 'specific') {
    const devices = registry.getAllDevices();
    const deviceId = await promptDeviceSelection(devices, `Which device do you want to turn ${action}?`);
    if (!deviceId) return null;
    return { type: 'device', deviceId };
  }

  return null;
}

/**
 * Prompts the user to select a device from a provided list.
 */
export async function promptDeviceSelection(devices: TuyaDevice[], message = 'Select a device:'): Promise<string | null> {
  if (devices.length === 0) {
    console.log('No devices available to select.');
    return null;
  }

  const choices = devices.map(device => ({
    name: `${device.name} [${device.ip || 'Unknown IP'}]`,
    value: device.id,
    description: `Category: ${device.category} | Product: ${device.product_name}`
  }));

  choices.push({ name: 'Cancel', value: 'cancel', description: '' });

  const answer = await select({
    message,
    choices,
    pageSize: 10,
  });

  if (answer === 'cancel') {
    console.log('Action cancelled.');
    return null;
  }

  return answer;
}
