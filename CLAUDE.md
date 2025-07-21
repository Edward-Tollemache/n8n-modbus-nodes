# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a custom n8n node package for industrial automation, providing Modbus protocol integration. The project provides three nodes:
- **ModbusTrigger**: Triggers workflows based on Modbus events
- **Modbus**: Read/write operations for Modbus devices (FC1-FC4) - Currently working well
- **ModbusDataConverter**: Converts raw Modbus register data to industrial data types - **Needs significant improvement**

## Primary Development Focus

This is a custom node being built for industrial automation purposes. The key goal is to create a seamless workflow where:
1. **Modbus Read Node** retrieves raw data from industrial devices
2. **Data Converter Node** transforms this raw data into usable formats

### Critical Requirements
- The Data Converter must work hand-in-hand with the Modbus Read Node
- Focus on simplicity and intuitiveness for non-technical users
- Support common industrial data extraction patterns
- Make the data flow from read → convert → use as straightforward as possible

## Development Commands

```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript and copies icons)
npm run build

# Watch mode for development
npm run dev

# Lint the code
npm run lint

# Fix linting issues
npm run lintfix

# Format code with Prettier
npm run format
```

## Architecture

### Node Structure
- Each node consists of:
  - `.node.ts` - Main node implementation
  - `.node.json` - Node metadata and UI configuration
  - Icon files (`.svg`)

### Key Files
- `nodes/Modbus/GenericFunctions.ts` - Shared Modbus utility functions
- `nodes/ModbusDataConverter/DataConversionUtils.ts` - Data type conversion logic
- `nodes/ModbusDataConverter/IndustrialUnits.ts` - Industrial unit conversion definitions
- `nodes/ModbusDataConverter/ValidationUtils.ts` - Input validation functions
- `credentials/ModbusApi.credentials.ts` - Connection credential structure

### Build Output
- TypeScript compiles to `dist/` directory
- Icons are copied to corresponding locations in `dist/`
- The package exports nodes via `n8n` configuration in package.json

## Data Converter Improvement Areas

### Current State
- Supports various data types (INT16, UINT16, INT32, UINT32, FLOAT32, SCALED, BITFIELD, BCD)
- Has industrial unit conversions
- Requires manual configuration

### Needed Improvements
1. **Auto-detection of data format** from Modbus Read output
2. **Simplified UI** with common industrial presets
3. **Visual data mapping** between raw registers and converted values
4. **Batch processing** for multiple register conversions
5. **Data validation** with industrial-specific ranges
6. **Common templates** for typical industrial devices (PLCs, sensors, meters)

## Important Development Notes

1. **n8n Node Standards**: Follow n8n community node development patterns. All nodes must implement `INodeType` interface and use n8n's workflow methods.

2. **TypeScript Configuration**: Strict mode is enabled. Ensure all types are properly defined and handle null checks.

3. **Modbus Function Codes**:
   - FC1: Read Coils (Boolean values)
   - FC2: Read Discrete Inputs (Boolean values)
   - FC3: Read Holding Registers (16-bit values)
   - FC4: Read Input Registers (16-bit values)

4. **Industrial Use Cases**: Common scenarios include:
   - Temperature sensor data extraction
   - Pressure transmitter readings
   - Flow meter totalization
   - Power meter data
   - PLC status and control values

5. **Testing**: Test with real industrial devices or Modbus simulators. Common test scenarios:
   - Multi-register floating point values
   - Scaled integer values with offsets
   - Bit-packed status registers
   - BCD encoded values

6. **Publishing**: The `prepublishOnly` script ensures the project is built before npm publish.

---

## SCRATCHPAD - Current Work Session

### PROJECT COMPLETED ✅ - FINAL SIMPLIFIED VERSION v0.8.0

**Final Status**: Successfully created a simplified, focused Modbus Data Converter based on user feedback.

**Final Implementation Features**:

**Quick Convert Mode** - Comprehensive but simple:
- Single Value (INT16/Scaled) - Basic register conversion
- Float (2 Registers) - IEEE 754 32-bit floating point
- Long Integer (2 Registers) - 32-bit signed/unsigned integers
- Double (4 Registers) - 64-bit double precision
- BCD (Binary Coded Decimal) - Industrial BCD conversion
- Bitfield (Status/Flags) - Individual bit extraction
- All Common Types - Shows all conversions for exploration

**Scaling System**:
- Simple checkbox to enable scaling
- Predefined ratios: 1000:1, 100:1, 10:1, 1:1, 1:10, 1:100, 1:1000
- Custom scaling factor option
- Applied to all conversion types

**Custom Mode** - Advanced configuration:
- Multiple conversion rules per execution
- Full data type support (INT16, UINT16, INT32, UINT32, FLOAT32, SCALED)
- Configurable byte order and scaling per rule
- Named output fields

**Key Learnings**:
- Simplicity won over complexity - user feedback confirmed this approach
- Quick Convert mode provides excellent usability for common cases
- Custom mode handles advanced scenarios without overwhelming basic users
- Scaling system with predefined ratios is intuitive and practical
- Starting from scratch was the right call vs. incrementally fixing complex code

**Architecture Changes**:
- Completely rewrote converter with clean, simple structure
- Removed all complex utility files that weren't being used effectively
- Used standalone functions instead of complex class hierarchies
- Focused on two clear modes: Quick and Custom

**Files in Final Version**:
- Main converter: `nodes/ModbusDataConverter/ModbusDataConverter.node.ts` (v4)
- Core conversion logic: `nodes/ModbusDataConverter/DataConversionUtils.ts`
- Package configuration: `package.json` (v0.8.0)

**Testing Results**:
- TypeScript compilation: ✅ Success
- Build process: ✅ Success  
- npm publish: ✅ Success (v0.8.0)
- Package size: 66.6 kB (reasonable size)

**User Success Metrics**:
- Simple UI with progressive disclosure
- Comprehensive conversion options in Quick mode
- Practical scaling system with common industrial ratios
- Clean output with metadata for debugging
- Functional Custom mode for advanced users

---

## Session Update - July 20, 2025

### Output Standardization (v0.10.0-0.10.3)
Successfully improved converter output based on user feedback:
- Added configurable output field names
- Added metadata inclusion toggle
- Added timestamp support
- Improved long integer value selection (signed/unsigned/both)
- Changed scale factor from dropdown to direct number input

### Node Grouping Investigation (v0.11.0-0.14.0)
User wanted converter to appear in same MODBUS section as other nodes:
- **v0.12.0**: Integrated converter as third operation in MODBUS node - achieved grouping but user wanted separate draggable nodes
- **v0.13.0-0.13.3**: Tried various approaches: naming patterns, group types, removing JSON files
- **v0.14.0**: Moved converter files to same folder as other Modbus nodes
- **Research findings**: n8n doesn't support custom grouping for community nodes - separate nodes will appear in separate sections
- **Final state**: Converter remains separate node with own section - this is a limitation of n8n's architecture