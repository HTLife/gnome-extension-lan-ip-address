import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class LanIpAddressPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.lan-ip-address');

        // Create a preferences page
        const page = new Adw.PreferencesPage();
        window.add(page);

        // Create a preferences group
        const group = new Adw.PreferencesGroup({
            title: 'Network Interface Settings',
            description: 'Configure which network interface to display'
        });
        page.add(group);

        // Get available interfaces
        const interfaces = this._getNetworkInterfaces();

        // Interface selection row
        const interfaceRow = new Adw.ActionRow({
            title: 'Network Interface',
            subtitle: 'Select a specific interface or leave empty for auto-detection'
        });

        const interfaceEntry = new Gtk.Entry({
            text: settings.get_string('interface-name'),
            placeholder_text: 'Auto-detect (empty)',
            valign: Gtk.Align.CENTER,
            hexpand: true
        });

        interfaceEntry.connect('changed', (entry) => {
            settings.set_string('interface-name', entry.get_text());
        });

        interfaceRow.add_suffix(interfaceEntry);
        interfaceRow.activatable_widget = interfaceEntry;
        group.add(interfaceRow);

        // Available interfaces info row
        const availableRow = new Adw.ActionRow({
            title: 'Available Interfaces',
            subtitle: interfaces.length > 0 ? interfaces.join(', ') : 'None detected'
        });
        group.add(availableRow);

        // Show interface name toggle
        const showNameRow = new Adw.ActionRow({
            title: 'Show Interface Name',
            subtitle: 'Display the interface name with the IP address'
        });

        const showNameSwitch = new Gtk.Switch({
            active: settings.get_boolean('show-interface-name'),
            valign: Gtk.Align.CENTER
        });

        settings.bind(
            'show-interface-name',
            showNameSwitch,
            'active',
            0 // Gio.SettingsBindFlags.DEFAULT
        );

        showNameRow.add_suffix(showNameSwitch);
        showNameRow.activatable_widget = showNameSwitch;
        group.add(showNameRow);
    }

    _getNetworkInterfaces() {
        try {
            const command_output_bytes = GLib.spawn_command_line_sync('ip -o link show')[1];
            const command_output_string = String.fromCharCode.apply(null, command_output_bytes);
            const lines = command_output_string.split('\n');
            const interfaces = [];

            for (let line of lines) {
                // Parse lines like "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> ..."
                const match = line.match(/^\d+:\s+([^:@]+)/);
                if (match && match[1] !== 'lo') {
                    interfaces.push(match[1].trim());
                }
            }

            return interfaces;
        } catch (e) {
            return [];
        }
    }
}
