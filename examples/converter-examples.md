# Modbus Data Converter Examples

## Simple Temperature Sensor Example

### Scenario
You have a temperature sensor connected via Modbus that returns temperature as a 32-bit float across two registers.

### Old Way (Complex)
```javascript
// Modbus Read Node Output:
{
  "functionCode": "FC3",
  "address": 100,
  "quantity": 2,
  "data": [16968, 41943]
}

// Old Converter Settings Required:
- Input Source: "data"
- Add Conversion Rule:
  - Name: "temperature"
  - Start Register: 0
  - Data Type: "float32"
  - Byte Order: "BE"
  - Enable Unit Conversion: true
  - From: "celsius"
  - To: "fahrenheit"
```

### New Way (Simple)
```javascript
// Same Modbus Read Node Output

// New Converter Settings:
- Conversion Mode: "Auto-Detect"
// That's it! The converter automatically:
// 1. Detects it's Modbus data
// 2. Sees two registers that form a valid float
// 3. Recognizes it's in temperature range
// 4. Provides both Celsius and Fahrenheit

// Output:
{
  "value": 23.45,
  "type": "float32",
  "temperature_celsius": 23.45,
  "temperature_fahrenheit": 74.21
}
```

## Power Meter Example

### Old Way
```javascript
// Modbus Read Node Output:
{
  "functionCode": "FC3",
  "address": 0,
  "quantity": 14,
  "data": [17213, 52429, 17214, 13107, 17215, 26214, ...]
}

// Required 7 separate conversion rules for:
// - Voltage L1 (registers 0-1, float32)
// - Voltage L2 (registers 2-3, float32)
// - Voltage L3 (registers 4-5, float32)
// - Current L1 (registers 6-7, float32)
// - Current L2 (registers 8-9, float32)
// - Current L3 (registers 10-11, float32)
// - Total Power (registers 12-13, float32)
```

### New Way
```javascript
// Same Modbus Read Node Output

// New Converter Settings:
- Conversion Mode: "Device Preset"
- Device Type: "Power Meter"

// Output:
{
  "device_type": "Power Meter",
  "voltage_l1": 230.5,
  "voltage_l2": 231.2,
  "voltage_l3": 229.8,
  "current_l1": 15.3,
  "current_l2": 14.8,
  "current_l3": 15.1,
  "power_total": 10.5  // Already converted to kW
}
```

## PLC Status Register Example

### Old Way
```javascript
// Multiple conversion rules needed for bitfield extraction
```

### New Way
```javascript
// Modbus Read Node Output:
{
  "functionCode": "FC3",
  "address": 0,
  "quantity": 4,
  "data": [43690, 255, 1500, 1485]
}

// New Converter Settings:
- Conversion Mode: "Device Preset"
- Device Type: "PLC Status"

// Output:
{
  "device_type": "PLC Status Registers",
  "status_word": 43690,
  "alarm_word": 255,
  "setpoint": 1500,
  "actual_value": 1485
}
```

## Quick Single Value Scaling

### New Way Only
```javascript
// For simple scaling of analog values:
// Modbus Output: { "data": [27648] }  // Raw 4-20mA value

// Converter Settings:
- Conversion Mode: "Quick Convert"
- Quick Convert Type: "Single Value (INT16/Scaled)"

// Output:
{
  "value": 27648,
  "scaled_100": 276.48,    // Divided by 100
  "scaled_1000": 27.648    // Divided by 1000
}
```

## Benefits of the New Converter

1. **Auto-Detection**: Automatically recognizes Modbus data structure
2. **Smart Suggestions**: Provides hints about likely data types
3. **Device Presets**: Common industrial devices pre-configured
4. **Quick Mode**: Fast conversion for simple cases
5. **Less Configuration**: Most common cases work with minimal setup
6. **Intuitive Output**: Clear, named fields instead of array indices

## Migration Guide

If you have existing workflows:
1. The enhanced converter is backward compatible
2. Use "Custom" mode to access all original features
3. Test with "Auto-Detect" mode first - it might just work!
4. Check if your device matches a preset for even simpler setup