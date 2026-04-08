# Smart Home Setup Guide

Lumina controls smart devices (bulbs, switches, etc.) using the **TinyTuya** integration, allowing for high-performance, local-network control.

---

## 1. Prerequisites
Lumina uses Python scripts to communicate with Tuya devices. Ensure you have the necessary Python dependencies installed:
```bash
sh setup.sh
```

## 2. Scan for Devices
Before Lumina can control your devices, it needs to find them on your local network. Run the built-in scanner:
```bash
npm run cli -- scan
```

The scan will:
- Discover devices on your Wi-Fi.
- Generate a `tinytuya.json` configuration file.
- Identify the Local IP and Device ID for your hardware.

## 3. Configure Credentials (Optional)
If your devices require a Local Key, you may need to run the TinyTuya wizard:
```bash
# In your terminal
python3 -m tinytuya wizard
```
Follow the prompts to link your Tuya IoT Platform account and fetch local keys for all devices.

## 4. Usage
Once devices are scanned, you can control them using the "Direct Lane" or "AI Lane":

### Direct Lane (Fast)
```bash
npm run cli -- bulb on
npm run cli -- bulb off
npm run cli -- bulb brightness 50
```

### AI Lane (Natural Language)
```bash
npm run cli -- bulb -m "make the light warm and dim"
```
Lumina will automatically decide which devices to adjust based on your request!
