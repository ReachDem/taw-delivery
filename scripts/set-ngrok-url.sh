#!/bin/bash
# Script to update NEXT_PUBLIC_APP_URL with current ngrok URL
# Usage: ./scripts/set-ngrok-url.sh https://abc123.ngrok-free.app

if [ -z "$1" ]; then
    echo "Usage: $0 <ngrok-url>"
    echo "Example: $0 https://abc123.ngrok-free.app"
    exit 1
fi

NGROK_URL="$1"

# Remove trailing slash if present
NGROK_URL="${NGROK_URL%/}"

# Update .env file
if grep -q "NEXT_PUBLIC_APP_URL=" .env; then
    # Replace existing line
    sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=$NGROK_URL|" .env
    echo "✅ Updated NEXT_PUBLIC_APP_URL to: $NGROK_URL"
else
    # Add new line
    echo "NEXT_PUBLIC_APP_URL=$NGROK_URL" >> .env
    echo "✅ Added NEXT_PUBLIC_APP_URL: $NGROK_URL"
fi

echo ""
echo "⚠️  N'oublie pas de redémarrer le serveur Next.js !"
echo "   pnpm dev"
