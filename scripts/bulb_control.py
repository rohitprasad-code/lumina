import sys
import json
import os
import argparse
import tinytuya

# Path to the snapshot config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "snapshot.json")

def load_config():
    """Load the device snapshot configuration."""
    if not os.path.exists(CONFIG_PATH):
        return None, f"Config file not found at {CONFIG_PATH}"
    
    try:
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f), None
    except Exception as e:
        return None, f"Failed to parse config: {str(e)}"

def get_device(config, search_term=None):
    """Find a device by ID or name, or return the first one."""
    devices = config.get("devices", [])
    if not devices:
        return None, "No devices found in config"
    
    if search_term:
        for d in devices:
            if d.get("id") == search_term or d.get("name") == search_term:
                return d, None
        return None, f"Device '{search_term}' not found"
    
    # Default to first device
    return devices[0], None

def main():
    parser = argparse.ArgumentParser(description="Lumina CLI - Tuya Bulb Control")
    parser.add_argument("action", choices=["on", "off", "status", "toggle", "brightness", "color"], 
                        help="Action to perform on the bulb")
    parser.add_argument("value", nargs="?", 
                        help="Value for brightness (1-100) or color (hex code)")
    parser.add_argument("--device", help="Device ID or Name to target")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--version", default="3.5", help="Tuya protocol version (default 3.5)")
    
    args = parser.parse_args()
    
    config, err = load_config()
    if err:
        output = {"status": "error", "message": err}
        print(json.dumps(output) if args.json else err)
        sys.exit(1)
    
    device_info, err = get_device(config, args.device)
    if err:
        output = {"status": "error", "message": err}
        print(json.dumps(output) if args.json else err)
        sys.exit(1)
        
    device_id = device_info["id"]
    ip = device_info["ip"]
    local_key = device_info.get("key")
    
    if not local_key:
        err = f"Local Key missing for device {device_id}. Run 'tinytuya wizard' or update snapshot.json."
        output = {"status": "error", "message": err}
        print(json.dumps(output) if args.json else err)
        sys.exit(1)

    try:
        # Initialize bulb
        d = tinytuya.BulbDevice(device_id, ip, local_key)
        d.set_version(float(args.version))
        
        result = {"status": "success", "action": args.action, "device": device_id}
        
        if args.action == "on":
            d.turn_on()
        elif args.action == "off":
            d.turn_off()
        elif args.action == "toggle":
            status = d.status()
            # DP 20 is typically the switch
            is_on = status.get("dps", {}).get("20") or status.get("dps", {}).get("1")
            if is_on:
                d.turn_off()
                result["state"] = "off"
            else:
                d.turn_on()
                result["state"] = "on"
        elif args.action == "status":
            res = d.status()
            result["data"] = res
        elif args.action == "brightness":
            if not args.value:
                raise ValueError("Brightness value required (1-100)")
            val = int(args.value)
            d.set_brightness_percentage(val)
            result["value"] = val
        elif args.action == "color":
            if not args.value:
                raise ValueError("Color hex value required (e.g., FF0000)")
            
            # Remove optional # character
            color_hex = args.value.lstrip('#')
            
            if len(color_hex) != 6:
                raise ValueError(f"Invalid color hex format '{args.value}'. Expected 6 characters (e.g., FF0000).")
                
            try:
                # Convert hex to RGB values
                r = int(color_hex[0:2], 16)
                g = int(color_hex[2:4], 16)
                b = int(color_hex[4:6], 16)
            except ValueError:
                raise ValueError(f"Invalid hex characters in color '{args.value}'.")
                
            d.set_colour(r, g, b)
            result["value"] = args.value
            
        if args.json:
            print(json.dumps(result))
        else:
            msg = f"Executed {args.action} on {device_info.get('name', device_id)}"
            if "state" in result: msg += f" (Now {result['state']})"
            print(msg)
            if args.action == "status":
                print(json.dumps(result["data"], indent=2))
                
    except Exception as e:
        err = f"Operation failed: {str(e)}"
        output = {"status": "error", "message": err}
        print(json.dumps(output) if args.json else err)
        sys.exit(1)

if __name__ == "__main__":
    main()
