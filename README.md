![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-modbus-fccomplete

## Description

n8n community node package for industrial automation with Modbus protocol support. Includes three nodes for reading, writing, and converting Modbus data.

## Features

### Nodes

1. **Modbus Trigger** - Triggers workflows based on Modbus events
2. **Modbus** - Read/write operations for function codes FC1-FC4
3. **Modbus Data Converter (Enhanced)** - Converts raw register data with auto-detection and presets

### Capabilities

- Function codes: FC1 (Read Coils), FC2 (Read Discrete Inputs), FC3 (Read Holding Registers), FC4 (Read Input Registers)
- Data types: INT16, UINT16, INT32, UINT32, FLOAT32, Scaled values, Bitfields, BCD
- Byte ordering: Big Endian and Little Endian
- Unit conversions: Temperature, pressure, flow, power
- Validation and error handling options

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install n8n-nodes-modbus-fccomplete
```

## Quick Start

### Temperature Sensor Example

1. **Modbus Node**:
   - Function Code: FC3 (Read Holding Registers)
   - Memory Address: Sensor register address
   - Quantity: 2 (for float32 values)

2. **Modbus Data Converter (Enhanced)**: 
   - Conversion Mode: "Auto-Detect"
   - Automatically detects float32 temperature data

### Device Preset Example

**Power Meter**:
- Conversion Mode: "Device Preset"
- Device Type: "Power Meter"
- Extracts voltage, current, and power readings

## Node Details

### Modbus Read/Write Node

- Read Operations: Coils, Discrete Inputs, Holding Registers, Input Registers
- Write Operations: Single register writes
- Output Format: JSON with function code, address, and data array

### Modbus Data Converter (Enhanced)

Conversion modes:

1. **Auto-Detect**: Identifies data patterns and suggests conversions
2. **Quick Convert**: Simple conversions for common scenarios
3. **Device Preset**: Pre-configured templates for industrial devices
4. **Custom**: Manual configuration

Device Presets:
- Temperature Sensor
- Pressure Transmitter
- Power Meter (3-phase)
- Flow Meter
- PLC Status Registers
- VFD Drive
- Tank Level Sensor
- Energy Meter

## Examples

### Auto-Detection Example
```javascript
// Input from Modbus Read
{
  "functionCode": "FC3",
  "address": 100,
  "quantity": 2,
  "data": [16968, 41943]
}

// Converter in Auto-Detect mode outputs:
{
  "value": 23.45,
  "type": "float32",
  "temperature_celsius": 23.45,
  "temperature_fahrenheit": 74.21
}
```

### Quick Convert for Scaling
```javascript
// Input: Raw 4-20mA value
{ "data": [27648] }

// Quick Convert Mode: "Single Value"
// Output:
{
  "value": 27648,
  "scaled_100": 276.48,
  "scaled_1000": 27.648
}
```

## Advanced Features

- Data validation with min/max ranges
- Error handling: stop on error, skip invalid, or use default values
- Performance mode for high-volume processing

## Credentials

Configure Modbus connection:
- **Host**: IP address of the Modbus device
- **Port**: Port number (default: 502)
- **Unit ID**: Modbus slave ID (default: 1)

## Support

- GitHub repository: https://github.com/Edward-Tollemache/n8n-modbus-nodes
- Examples: `./examples` folder
- Converter documentation: `./README-converter.md`

## Contributing

Submit Pull Requests for contributions.

## License

MIT License - see LICENSE.md for details

## Changelog

### v0.4.0
- Added Enhanced Data Converter with auto-detection
- Implemented industrial device presets
- Improved error handling and validation
- Added quick conversion modes
- Enhanced documentation and examples