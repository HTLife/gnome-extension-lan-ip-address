import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Utils from './utils.js';


export class LanIPAddressIndicator extends PanelMenu.Button {
    _init(settings) {
        // Chaining up to the super-class
        super._init(0, "LAN IP Address Indicator", false);

        this.buttonText = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.buttonText);

        // Store settings reference
        this._settings = settings;

        // Connect to settings changes
        this._settingsChangedId = this._settings.connect('changed', () => {
            this._updateLabel();
        });

        // Build the menu with all interfaces
        this._buildMenu();

        this._updateLabel();
    }

    _buildMenu() {
        // Clear existing menu items
        this.menu.removeAll();

        // Get all interfaces with their IPs
        const interfaces = Utils.getAllInterfaces();
        const currentInterface = this._settings.get_string('interface-name');

        if (interfaces.length === 0) {
            const noInterfaceItem = new PopupMenu.PopupMenuItem('No interfaces found', {
                reactive: false
            });
            this.menu.addMenuItem(noInterfaceItem);
            return;
        }

        // Add a menu item for each interface
        for (let iface of interfaces) {
            const label = `${iface.name}: ${iface.ip}`;
            const menuItem = new PopupMenu.PopupMenuItem(label);

            // Highlight the currently selected interface
            if (currentInterface === iface.name) {
                menuItem.setOrnament(PopupMenu.Ornament.DOT);
            }

            menuItem.connect('activate', () => {
                this._switchInterface(iface.name);
            });

            this.menu.addMenuItem(menuItem);
        }

        // Add separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Add "Auto-detect" option
        const autoItem = new PopupMenu.PopupMenuItem('Auto-detect');
        if (currentInterface === '') {
            autoItem.setOrnament(PopupMenu.Ornament.DOT);
        }
        autoItem.connect('activate', () => {
            this._switchInterface('');
        });
        this.menu.addMenuItem(autoItem);
    }

    _switchInterface(interfaceName) {
        // Update the setting
        this._settings.set_string('interface-name', interfaceName);

        // Rebuild the menu to update the ornaments
        this._buildMenu();

        // Update the label immediately
        this._updateLabel();
    }

    _updateLabel() {
        const priority = 0; // G_PRIORITY_DEFAULT
        const refreshTime = 5; // in seconds

        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = undefined;
        }
        this._timeout = GLib.timeout_add_seconds(priority, refreshTime, () => { this._updateLabel() });

        // Get settings values
        const interfaceName = this._settings.get_string('interface-name');
        const showInterfaceName = this._settings.get_boolean('show-interface-name');

        this.buttonText.set_text(Utils.getLanIp(interfaceName, showInterfaceName));

        // Rebuild menu to reflect any IP changes
        this._buildMenu();
    }

    stop() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
        }
        this._timeout = undefined;

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        this._settings = null;
        this.menu.removeAll();
    }
}

