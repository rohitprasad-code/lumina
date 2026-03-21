import sys

def control_bulb(command):
    print(f"Controlling bulb with command: {command}")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        control_bulb(sys.argv[1:])
    else:
        print("No command provided")
