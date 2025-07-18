# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an existing n8n community node package that provides Modbus TCP integration for n8n workflows. It consists of two main node types:

1. **Modbus Node** (`nodes/Modbus/Modbus.node.ts`) - Performs read/write operations on Modbus holding registers
2. **Modbus Trigger Node** (`nodes/Modbus/ModbusTrigger.node.ts`) - Monitors Modbus addresses for changes and triggers workflows

## Current Limitations & Expansion Goals

**Current State**: The nodes currently only support Modbus Holding Registers (Function Code 03 for read, Function Code 06 for write single register).

**Expansion Goal**: Extend functionality to support all four primary Modbus function codes:
- **FC1**: Read Coils (discrete outputs)
- **FC2**: Read Discrete Inputs 
- **FC3**: Read Holding Registers (current functionality)
- **FC4**: Read Input Registers

This will provide complete Modbus data access capabilities for industrial automation scenarios.

## Development Commands

```bash
# Build the project (compile TypeScript and copy icons)
npm run build

# Development mode with TypeScript watching
npm run dev

# Code formatting
npm run format

# Linting
npm run lint

# Auto-fix linting issues
npm run lintfix

# Pre-publish checks (build + lint)
npm run prepublishOnly
```

## Architecture

### Core Components

- **Credentials**: `credentials/ModbusApi.credentials.ts` - Defines connection parameters (host, port, protocol)
- **Generic Functions**: `nodes/Modbus/GenericFunctions.ts` - Shared utilities for creating Modbus TCP connections
- **Build System**: `gulpfile.js` - Handles copying SVG icons to dist directory during build

### Node Structure

Both nodes follow n8n's community node conventions:
- Use TypeScript with n8n-workflow types
- Implement `INodeType` interface
- Define node properties, credentials, and execution logic
- Handle errors via `NodeOperationError`

### Key Dependencies

- `modbus-stream` - Core Modbus TCP communication library
- `n8n-workflow` - n8n workflow types and utilities (peer dependency)

### Data Flow

1. **Modbus Node**: Executes synchronous read/write operations
2. **Modbus Trigger Node**: Polls Modbus addresses at configurable intervals and emits data when changes are detected

## Testing

No test framework is currently configured. When adding tests, determine the appropriate testing approach based on n8n community node standards.