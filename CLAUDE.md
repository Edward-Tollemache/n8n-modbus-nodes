# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node package (`n8n-nodes-modbus-fccomplete`) providing industrial Modbus protocol integration. The package contains three nodes:

- **ModbusTrigger**: Event-based workflow triggers for Modbus changes
- **Modbus**: Read/write operations (FC1-FC4 function codes)
- **ModbusDataConverter**: Converts raw register data to industrial data types

## Commands

```bash
# Install dependencies
npm install

# Build (TypeScript compilation + icon copying)
npm run build

# Development with watch mode
npm run dev

# Code quality
npm run lint        # Run ESLint
npm run lintfix     # Auto-fix linting issues
npm run format      # Format with Prettier

# Publishing
npm publish         # Triggers prepublishOnly hook (builds first)
```

## Architecture

### Node Structure
Each n8n node consists of:
- `.node.ts` - Implementation (must implement `INodeType` interface)
- `.node.json` - UI metadata and configuration
- `.svg` icon file

### Key Implementation Files
- `nodes/Modbus/GenericFunctions.ts` - Shared Modbus utilities
- `nodes/ModbusDataConverter/DataConversionUtils.ts` - Core conversion logic
- `credentials/ModbusApi.credentials.ts` - Connection credentials

### Build Process
1. TypeScript compiles to `dist/` directory (ES2019, CommonJS)
2. Gulp copies icon files to `dist/nodes/` and `dist/credentials/`
3. Package exports nodes via `n8n` field in package.json

### Data Converter Features

**Quick Convert Mode** (simplified interface):
- Single Value (INT16/Scaled)
- Float (2 Registers - IEEE 754)
- Long Integer (2 Registers - INT32/UINT32)
- Double (4 Registers - 64-bit)
- BCD (Binary Coded Decimal)
- Bitfield (extract individual bits)
- All Common Types (shows all conversions)

**Scaling System**:
- Predefined industrial ratios: 1000:1, 100:1, 10:1, 1:1, 1:10, 1:100, 1:1000
- Custom scale factor input
- Optional timestamp and metadata

**Custom Mode** (advanced):
- Multiple conversion rules
- Full data type support (INT16, UINT16, INT32, UINT32, FLOAT32, SCALED)
- Configurable byte order per rule
- Named output fields

### Modbus Function Codes
- FC1: Read Coils (Boolean)
- FC2: Read Discrete Inputs (Boolean)
- FC3: Read Holding Registers (16-bit)
- FC4: Read Input Registers (16-bit)

### Industrial Focus
Common use cases:
- Temperature/pressure sensors
- Flow meters, power meters
- PLC data extraction
- Multi-register values (floats, longs)
- Scaled integers with industrial ratios
- Bit-packed status registers

### Important Notes
1. **TypeScript**: Strict mode enabled - handle all null checks
2. **n8n Limitations**: Community nodes cannot be grouped together in the UI
3. **Testing**: Use real devices or Modbus simulators to test multi-register values, scaling, and bit operations
4. **Simplicity First**: Based on user feedback, prioritize simple interfaces over complex features