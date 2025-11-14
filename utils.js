import GLib from 'gi://GLib';

export const getAllInterfaces = () => {
    const interfaces = [];

    try {
        // Get all network interfaces
        const command_output_bytes = GLib.spawn_command_line_sync('ip -o link show')[1];
        const command_output_string = String.fromCharCode.apply(null, command_output_bytes);
        const lines = command_output_string.split('\n');

        for (let line of lines) {
            // Parse lines like "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> ..."
            const match = line.match(/^\d+:\s+([^:@]+)/);
            if (match && match[1] !== 'lo') {
                const ifaceName = match[1].trim();

                // Get IP address for this interface
                try {
                    const ip_output_bytes = GLib.spawn_command_line_sync(`ip -4 addr show ${ifaceName}`)[1];
                    const ip_output_string = String.fromCharCode.apply(null, ip_output_bytes);
                    const ipRe = new RegExp(/inet ([0-9.]+)\//);
                    const ipMatches = ip_output_string.match(ipRe);

                    if (ipMatches && ipMatches[1]) {
                        interfaces.push({
                            name: ifaceName,
                            ip: ipMatches[1]
                        });
                    }
                } catch (e) {
                    // Skip interfaces without IP addresses
                }
            }
        }
    } catch (e) {
        // Return empty array on error
    }

    return interfaces;
}

export const getLanIp = (interfaceName = '', showInterfaceName = false) => {
    let ipAddress = '';
    let actualInterface = '';

    if (interfaceName && interfaceName.trim() !== '') {
        // Get IP address for a specific interface
        try {
            const command_output_bytes = GLib.spawn_command_line_sync(`ip -4 addr show ${interfaceName}`)[1];
            const command_output_string = String.fromCharCode.apply(null, command_output_bytes);

            // Parse output like "inet 192.168.1.100/24 brd ..."
            const Re = new RegExp(/inet ([0-9.]+)\//);
            const matches = command_output_string.match(Re);
            if (matches && matches[1]) {
                ipAddress = matches[1];
                actualInterface = interfaceName;
            } else {
                return `${interfaceName}: N/A`;
            }
        } catch (e) {
            return `${interfaceName}: Error`;
        }
    } else {
        // Auto-detect using default route
        // Ask the IP stack what route would be used to reach 1.1.1.1 (Cloudflare DNS)
        // Specifically, what src would be used for the 1st hop?
        try {
            const command_output_bytes = GLib.spawn_command_line_sync('ip route get 1.1.1.1')[1];
            const command_output_string = String.fromCharCode.apply(null, command_output_bytes);

            // Output of the "ip route" command will be a string
            // " ... src 1.2.3.4 ... dev eth0 ..."
            // Extract the IP address after "src"
            const srcRe = new RegExp(/src ([^ ]+)/);
            const srcMatches = command_output_string.match(srcRe);
            if (srcMatches && srcMatches[1]) {
                ipAddress = srcMatches[1];
            }

            // Extract the interface name after "dev"
            const devRe = new RegExp(/dev ([^ ]+)/);
            const devMatches = command_output_string.match(devRe);
            if (devMatches && devMatches[1]) {
                actualInterface = devMatches[1];
            }
        } catch (e) {
            return '';
        }
    }

    if (!ipAddress) {
        return '';
    }

    if (showInterfaceName && actualInterface) {
        return `${actualInterface}: ${ipAddress}`;
    }

    return ipAddress;
}

