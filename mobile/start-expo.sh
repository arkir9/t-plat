#!/bin/bash
# Clean start for Expo so phone/simulator can connect.
# Leave this terminal OPEN while using the app.

cd "$(dirname "$0")"

echo "Stopping anything on port 8081..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
sleep 1

# Use LAN IP so physical device can connect; simulator can use 127.0.0.1
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$LAN_IP" ]; then
  LAN_IP=$(ipconfig getifaddr en1 2>/dev/null)
fi
LAN_IP=${LAN_IP:-127.0.0.1}
export REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP"
# API URL for physical device (simulator can use localhost too via this)
export EXPO_PUBLIC_API_URL="http://${LAN_IP}:3000/api/v1"

echo ""
echo "=============================================="
echo "  HOW TO OPEN THE APP (keep this terminal open)"
echo "=============================================="
echo ""
echo "  iOS Simulator:"
echo "    After the server is ready, press  i  in this terminal"
echo "    (or enter in Expo Go in simulator: exp://127.0.0.1:8081)"
echo ""
echo "  Physical phone:"
echo "    1. Install 'Expo Go' from the App Store"
echo "    2. Phone and Mac must be on the same Wi‑Fi"
echo "    3. In Expo Go: tap 'Enter URL manually'"
echo "    4. Type: exp://${LAN_IP}:8081"
echo ""
echo "  If phone cannot connect: npm run start:tunnel"
echo "=============================================="
echo ""

# Use --clear only when you have cache/stale-bundle issues
# --port 8081 avoids Metro probing for a free port
# Use expo@latest to avoid "exec is not a function" bug in some local @expo/cli installs
exec npx expo@latest start --lan --port 8081
