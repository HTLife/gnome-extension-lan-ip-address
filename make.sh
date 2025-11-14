#!/bin/bash

# Compile the schema
glib-compile-schemas schemas/

if [[ -f lan-ip-address.zip ]] ; then rm lan-ip-address.zip ; fi
zip -9 -r lan-ip-address.zip extension.js utils.js LanIPAddressIndicator.js prefs.js metadata.json schemas/ *.md

