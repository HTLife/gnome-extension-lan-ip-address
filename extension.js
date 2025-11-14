import { panel } from 'resource:///org/gnome/shell/ui/main.js';
import { LanIPAddressIndicator } from './LanIPAddressIndicator.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import GObject from 'gi://GObject';


export default class LanIpAddressExtension extends Extension {
    _indicator;

    enable() {
        const settings = this.getSettings('org.gnome.shell.extensions.lan-ip-address');
        this._indicator = new LanIPAddressIndicator(settings);
        panel.addToStatusArea('lan-ip-address-indicator', this._indicator);
    }

    disable() {
        this._indicator.stop();
        this._indicator.destroy();
        this._indicator = undefined;
    }
}

GObject.registerClass(
    {GTypeName: 'LanIPAddressIndicator'},
    LanIPAddressIndicator
);

