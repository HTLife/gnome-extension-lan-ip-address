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
            subtitle: 'Select a specific interface or use auto-detection'
        });

        const interfaceCombo = new Gtk.ComboBoxText({
            valign: Gtk.Align.CENTER,
        });

        // Add "Auto-detect" as the first option
        interfaceCombo.append('', 'Auto-detect');

        // Add all available interfaces
        for (let iface of interfaces) {
            interfaceCombo.append(iface, iface);
        }

        // Set the currently selected interface
        const currentInterface = settings.get_string('interface-name');
        interfaceCombo.set_active_id(currentInterface);

        interfaceCombo.connect('changed', (combo) => {
            const selectedId = combo.get_active_id();
            settings.set_string('interface-name', selectedId || '');
        });

        interfaceRow.add_suffix(interfaceCombo);
        interfaceRow.activatable_widget = interfaceCombo;
        group.add(interfaceRow);

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
