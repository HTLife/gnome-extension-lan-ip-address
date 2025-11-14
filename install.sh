#!/bin/bash

set -e

echo "Installing LAN IP Address GNOME Extension..."

# Compile the GSettings schema
echo "Compiling GSettings schema..."
glib-compile-schemas schemas/

# Build the extension zip package
echo "Building extension package..."
if [[ -f lan-ip-address.zip ]] ; then rm lan-ip-address.zip ; fi
zip -9 -r lan-ip-address.zip extension.js utils.js LanIPAddressIndicator.js prefs.js metadata.json schemas/ *.md

# Install the extension
echo "Installing extension..."
gnome-extensions install --force lan-ip-address.zip

# Restart the extension if it's already enabled
echo "Restarting extension..."
if gnome-extensions list | grep -q "lan-ip-address@mrhuber.com"; then
    gnome-extensions disable lan-ip-address@mrhuber.com 2>/dev/null || true
    gnome-extensions enable lan-ip-address@mrhuber.com
    echo "Extension restarted successfully!"
else
    echo "Extension installed. Enable it with:"
    echo "  gnome-extensions enable lan-ip-address@mrhuber.com"
fi

echo "Installation complete!"
echo ""
echo "To open preferences, run:"
echo "  gnome-extensions prefs lan-ip-address@mrhuber.com"
