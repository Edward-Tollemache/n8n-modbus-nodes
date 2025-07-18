# Modbus Data Converter Node

The Modbus Data Converter node transforms raw Modbus register data into usable industrial data types with comprehensive conversion capabilities, validation, and error handling.

## Features

- **Complete Data Type Support**: INT16, UINT16, INT32, UINT32, FLOAT32, SCALED, BITFIELD, BCD
- **Byte Order Configuration**: Big Endian (Motorola) and Little Endian (Intel) support
- **Industrial Unit Conversions**: Temperature, pressure, flow, power, and more
- **Validation & Error Handling**: Min/max bounds checking with configurable error strategies
- **Flexible Input/Output**: Multiple input sources and output formats
- **Performance Optimized**: Efficient processing for large datasets

## Usage

### Basic Setup

1. **Add the node** to your workflow after a Modbus read operation
2. **Configure input source** to match your Modbus data structure
3. **Add conversion rules** for each register you want to convert
4. **Set output format** according to your needs

### Input Sources

- **Data Property**: Uses `data` property from input (default for Modbus nodes)
- **Values Array**: Uses input as array of values
- **Registers Property**: Uses `registers` property from input
- **Custom Path**: Uses dot notation path (e.g., `response.data.registers`)

### Conversion Rules

Each conversion rule consists of:

- **Name**: Output field name
- **Start Register**: Starting register index (0-based)
- **Data Type**: Conversion type (INT16, UINT16, etc.)
- **Byte Order**: Big Endian or Little Endian
- **Additional Parameters**: Based on data type

## Data Types

### INT16 - Signed 16-bit Integer
Converts single register to signed integer (-32,768 to 32,767)

### UINT16 - Unsigned 16-bit Integer
Converts single register to unsigned integer (0 to 65,535)

### INT32 - Signed 32-bit Integer
Converts two consecutive registers to signed integer
- **Byte Order**: Determines register order (high/low)

### UINT32 - Unsigned 32-bit Integer
Converts two consecutive registers to unsigned integer
- **Byte Order**: Determines register order (high/low)

### FLOAT32 - IEEE 754 32-bit Float
Converts two consecutive registers to floating-point number
- **Byte Order**: Determines register order (high/low)

### SCALED - Raw Value with Scaling
Applies mathematical scaling to single register
- **Scale Factor**: Multiply raw value by this factor
- **Offset**: Add this value after scaling
- **Formula**: `(raw_value * scale_factor) + offset`

### BITFIELD - Bit Extraction
Extracts specific bits from single register
- **Bit Mask**: Hexadecimal mask for extraction (e.g., 0x00FF)
- **Bit Position**: Starting bit position (0-15)
- **Bit Length**: Number of bits to extract

### BCD - Binary Coded Decimal
Converts BCD encoded register to decimal number

## Advanced Features

### Unit Conversion

Convert between industrial units:

**Temperature**
- Celsius ↔ Fahrenheit
- Celsius ↔ Kelvin
- Fahrenheit ↔ Kelvin

**Pressure**
- Pascal ↔ Bar
- PSI ↔ Bar
- Pascal ↔ PSI

**Flow**
- GPM ↔ LPM
- CFM ↔ CMH

**Power**
- HP ↔ kW
- BTU/h ↔ kW

**And many more...**

### Validation

Enable validation for each conversion:
- **Min/Max Values**: Set acceptable range
- **Allow NaN**: Control NaN handling
- **Error Action**: Stop, skip, or use defaults

### Error Handling

Choose how to handle conversion errors:
- **Stop on Error**: Halt execution on first error
- **Skip Invalid**: Continue processing, skip failed conversions
- **Use Default Values**: Replace failed conversions with defaults

## Examples

### Example 1: Energy Meter Data

Convert raw Modbus registers from a power meter:

```javascript
// Input data from Modbus node
{
  "data": [1250, 156, 2350, 0, 15]
}

// Conversion Rules:
// 1. Registers 0-1: Total Power (UINT32, scale 1/1000, kW)
// 2. Register 2: Voltage (UINT16, scale 1/10, V)
// 3. Register 3: Current (UINT16, scale 1/100, A)
// 4. Register 4: Status (BITFIELD, bits 0-3)

// Output:
{
  "totalPower": 20.482,        // (1250 << 16 | 156) / 1000
  "voltage": 235.0,            // 2350 / 10
  "current": 0.0,              // 0 / 100
  "status": 15,                // bits 0-3 of register 4
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Example 2: Temperature Controller

Process temperature and control data:

```javascript
// Input registers: [0x41A0, 0x0000, 750, 8500]

// Conversion Rules:
// 1. Registers 0-1: Process Temperature (FLOAT32, °C to °F)
// 2. Register 2: Setpoint (INT16, scale 1/10)
// 3. Register 3: Output % (UINT16, scale 1/100, max 100)

// Output:
{
  "processTemperature": 68.0,  // 20°C converted to °F
  "setpoint": 75.0,            // 750 / 10
  "outputPercent": 85.0,       // 8500 / 100
  "conversions": {
    "processTemperature": {
      "value": 68.0,
      "originalValue": [0x41A0, 0x0000],
      "dataType": "float32",
      "valid": true,
      "metadata": {
        "byteOrder": "big_endian",
        "unitConversion": "celsius to fahrenheit"
      }
    }
  }
}
```

### Example 3: Multi-Device Dashboard

Process data from multiple devices:

```javascript
// Input: Complex nested structure
{
  "devices": {
    "meter1": {
      "registers": [1000, 2000, 3000]
    },
    "meter2": {
      "registers": [1500, 2500, 3500]
    }
  }
}

// Use Custom Path: "devices.meter1.registers"
// Process each device separately in workflow
```

## Output Formats

### Individual Fields
Each conversion creates a separate property:
```javascript
{
  "temperature": 25.5,
  "pressure": 1.2,
  "flow": 150.0
}
```

### Conversion Object
All conversions in single object:
```javascript
{
  "conversions": {
    "temperature": {
      "value": 25.5,
      "originalValue": 2550,
      "dataType": "scaled",
      "valid": true
    }
  }
}
```

### Both
Combines individual fields and conversion object

## Configuration Tips

### Performance Mode
Enable for large datasets (>100 registers):
- Optimizes memory allocation
- Reduces processing overhead
- Suitable for high-frequency polling

### Metadata
Add conversion metadata for troubleshooting:
- Scale factors used
- Unit conversions applied
- Byte order configuration
- Original values preserved

### Validation
Use validation for critical measurements:
- Set realistic min/max bounds
- Enable for safety-critical values
- Choose appropriate error handling

## Common Industrial Applications

### HVAC Systems
- Temperature conversions (°C to °F)
- Pressure monitoring (PSI to Bar)
- Flow rate calculations (GPM to LPM)
- Status bit extraction

### Power Monitoring
- Energy calculations (kWh)
- Power factor corrections
- Harmonic analysis
- Alarm status processing

### Process Control
- Analog input scaling
- PID setpoint conversions
- Control output percentages
- Safety interlock status

### Building Automation
- Sensor data normalization
- Unit standardization
- Alarm condition detection
- Energy efficiency calculations

## Troubleshooting

### Common Issues

**No Output Data**
- Check input source configuration
- Verify register data is numeric
- Ensure conversion rules are valid

**Invalid Conversions**
- Verify start register indices
- Check data type requirements
- Confirm byte order settings

**Unit Conversion Errors**
- Verify unit names match exactly
- Check conversion availability
- Ensure source data is numeric

**Performance Issues**
- Enable performance mode
- Reduce conversion rules
- Optimize input data structure

### Debug Tips

1. **Enable Metadata**: Add conversion details to output
2. **Use Individual Fields**: Easier to debug specific conversions
3. **Test with Skip Invalid**: Continue processing during development
4. **Check Original Values**: Verify input data is correct

## Integration with Modbus Nodes

The Modbus Data Converter works seamlessly with the Modbus and Modbus Trigger nodes:

```
Modbus → Modbus Data Converter → Your Logic
```

**Example Workflow:**
1. Modbus Trigger monitors register changes
2. Modbus Data Converter processes raw data
3. Switch node routes based on converted values
4. Set node updates dashboard or database

## API Reference

### Input Data Structure
```typescript
{
  data: number[];        // Default source
  registers: number[];   // Alternative source
  [customPath]: number[]; // Custom path source
}
```

### Conversion Rule Structure
```typescript
{
  name: string;
  startRegister: number;
  dataType: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'scaled' | 'bitfield' | 'bcd';
  byteOrder: 'big_endian' | 'little_endian';
  scaleFactor?: number;
  offset?: number;
  decimalPlaces?: number;
  bitMask?: number;
  bitPosition?: number;
  bitLength?: number;
  validation?: {
    enabled: boolean;
    min?: number;
    max?: number;
    allowNaN?: boolean;
  };
  unitConversion?: {
    from: string;
    to: string;
  };
}
```

### Output Data Structure
```typescript
{
  // Individual fields (if enabled)
  [conversionName]: any;
  [conversionName + '_metadata']?: object;
  
  // Conversion object (if enabled)
  conversions?: {
    [conversionName]: {
      value: any;
      originalValue: any;
      dataType: string;
      valid: boolean;
      metadata?: object;
    };
  };
  
  // Optional additions
  timestamp?: string;
  
  // Original input data preserved
  ...originalData
}
```

## Contributing

This node is part of the n8n-nodes-modbus-fccomplete package. Contributions are welcome!

- Report issues on [GitHub](https://github.com/Edward-Tollemache/n8n-modbus-nodes/issues)
- Submit pull requests for improvements
- Share industrial use cases and examples

## License

MIT License - see LICENSE file for details.