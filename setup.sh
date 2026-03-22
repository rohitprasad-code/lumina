#!/bin/bash

# Lumina — AI Agent Setup Script
# Automates TypeScript and Python environment configuration.

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Lumina Setup Initializing...${NC}"

# 1. Check for Prerequisites
echo -e "${BLUE}1/6 Checking Prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Warning: Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Warning: Python 3 is not installed. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}Prerequisites met.${NC}"

# 2. Setup TypeScript Environment
echo -e "${BLUE}2/6 Setting up TypeScript dependencies...${NC}"
npm install
echo -e "${GREEN}TypeScript dependencies installed.${NC}"

# 3. Setup Python Virtual Environment
echo -e "${BLUE}3/6 Setting up Python virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}Virtual environment created (.venv).${NC}"
else
    echo -e "Virtual environment already exists."
fi

./.venv/bin/python3 -m pip install --upgrade pip
./.venv/bin/python3 -m pip install -r requirements.txt
echo -e "${GREEN}Python requirements installed in .venv.${NC}"

# 4. Binary/CLI setup
echo -e "${BLUE}4/6 Registering lumina-cli...${NC}"
chmod +x src/cli/index.ts

# 5. Setup .env.local file
echo "TUYA_ACCESS_ID=" >> .env.local
echo "TUYA_ACCESS_SECRET=" >> .env.local
echo -e "${GREEN}.env.local created${NC}"

# 6. Final Steps
echo -e "${YELLOW}Final Step: Global Access${NC}"
echo -e "To use the name 'lumina-cli' globally, please run:"
echo -e "${BLUE}sudo npm link${NC}"
echo -e "----------------------------------------"

echo -e "${GREEN}SUCCESS! Lumina setup is complete.${NC}"
echo -e "You can now run commands using:"
echo -e "1. ${BLUE}./src/cli/index.ts bulb on${NC}"
echo -e "2. ${BLUE}npm run cli -- bulb on${NC}"
echo -e "3. ${BLUE}lumina-cli bulb on${NC} (after linking)"
