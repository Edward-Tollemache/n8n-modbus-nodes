import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { DataConversionUtils } from './DataConversionUtils';

export class ModbusDataConverter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MODBUS Converter',
		name: 'modbusDataConverter',
		icon: 'file:modbus.svg',
		group: ['transform'],
		version: 4,
		description: 'Convert Modbus register data with quick convert and custom options',
		eventTriggerDescription: '',
		defaults: {
			name: 'Modbus Data Converter',
		},
		//@ts-ignore
		inputs: ['main'],
		//@ts-ignore
		outputs: ['main'],
		properties: [
			// Mode Selection
			{
				displayName: 'Conversion Mode',
				name: 'conversionMode',
				type: 'options',
				options: [
					{
						name: 'Quick Convert',
						value: 'quick',
						description: 'Simple conversions for common Modbus data types',
					},
					{
						name: 'Custom',
						value: 'custom',
						description: 'Manual configuration for advanced use cases',
					},
				],
				default: 'quick',
				description: 'Choose how to convert the data',
			},

			// Quick Convert Options
			{
				displayName: 'Quick Convert Type',
				name: 'quickConvertType',
				type: 'options',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				options: [
					{
						name: 'Single Value (INT16/Scaled)',
						value: 'single',
						description: 'Convert single register value',
					},
					{
						name: 'Float (2 Registers)',
						value: 'float',
						description: 'Convert two registers to floating point',
					},
					{
						name: 'Long Integer (2 Registers)',
						value: 'long',
						description: 'Convert two registers to 32-bit integer',
					},
					{
						name: 'Double (4 Registers)',
						value: 'double',
						description: 'Convert four registers to 64-bit double',
					},
					{
						name: 'BCD (Binary Coded Decimal)',
						value: 'bcd',
						description: 'Convert BCD encoded values',
					},
					{
						name: 'Bitfield (Status/Flags)',
						value: 'bitfield',
						description: 'Extract individual bits from register',
					},
					{
						name: 'All Common Types',
						value: 'all',
						description: 'Show all possible conversions',
						action: 'Show all conversions for this data',
					},
				],
				default: 'float',
			},

			// Byte Order Option for Quick Convert
			{
				displayName: 'Byte Order',
				name: 'quickByteOrder',
				type: 'options',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
						quickConvertType: ['float', 'long', 'double'],
					},
				},
				options: [
					{
						name: 'Big Endian (BE)',
						value: 'BE',
						description: 'Most significant byte first (default)',
					},
					{
						name: 'Little Endian (LE)',
						value: 'LE',
						description: 'Least significant byte first',
					},
				],
				default: 'BE',
			},

			// Simple Scaling for Quick Convert
			{
				displayName: 'Scale',
				name: 'enableScaling',
				type: 'boolean',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				default: false,
				description: 'Apply scaling to the converted value',
			},

			{
				displayName: 'Scale Factor',
				name: 'scaleFactorValue',
				type: 'number',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
						enableScaling: [true],
					},
				},
				typeOptions: {
					numberPrecision: 6,
					minValue: 0.000001,
					maxValue: 1000000,
				},
				default: 1,
				description: 'Multiply result by this factor (e.g., 0.001 for ÷1000, 1000 for ×1000)',
			},

			// Value Selection for Multi-Value Outputs
			{
				displayName: 'Long Integer Value',
				name: 'longIntegerValue',
				type: 'options',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
						quickConvertType: ['long'],
					},
				},
				options: [
					{
						name: 'Signed (allows negative values)',
						value: 'signed',
						description: 'Treats the value as signed 32-bit integer',
					},
					{
						name: 'Unsigned (positive only)',
						value: 'unsigned', 
						description: 'Treats the value as unsigned 32-bit integer',
					},
					{
						name: 'Both (returns both signed and unsigned)',
						value: 'both',
						description: 'Returns both value_signed and value_unsigned',
					},
				],
				default: 'signed',
				description: 'Choose which value to return for 32-bit integers',
			},

			// Output Options - Always Visible
			{
				displayName: 'Include Conversion Metadata',
				name: 'includeMetadata',
				type: 'boolean',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				default: false,
				description: 'Include conversion details (type, scale factor, raw registers)',
			},

			{
				displayName: 'Add Timestamp',
				name: 'addTimestamp',
				type: 'boolean',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				default: false,
				description: 'Add timestamp to output',
			},

			{
				displayName: 'Output Field Name',
				name: 'outputFieldName',
				type: 'string',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				default: 'output',
				description: 'Name of the field containing converted values',
			},

			{
				displayName: 'Metadata Field Name',
				name: 'metadataFieldName',
				type: 'string',
				displayOptions: {
					show: {
						conversionMode: ['quick'],
						includeMetadata: [true],
					},
				},
				default: 'conversion',
				description: 'Name of the field containing conversion metadata',
			},

			// Custom Conversion Rules
			{
				displayName: 'Custom Conversions',
				name: 'conversions',
				type: 'collection',
				placeholder: 'Add Conversion',
				default: {},
				displayOptions: {
					show: {
						conversionMode: ['custom'],
					},
				},
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Conversion Rule',
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Name for the converted value',
					},
					{
						displayName: 'Start Register',
						name: 'startRegister',
						type: 'number',
						default: 0,
						description: 'Starting register index (0-based)',
					},
					{
						displayName: 'Data Type',
						name: 'dataType',
						type: 'options',
						options: [
							{
								name: 'INT16 - Signed 16-Bit Integer',
								value: 'int16',
							},
							{
								name: 'UINT16 - Unsigned 16-Bit Integer',
								value: 'uint16',
							},
							{
								name: 'INT32 - Signed 32-Bit Integer',
								value: 'int32',
							},
							{
								name: 'UINT32 - Unsigned 32-Bit Integer',
								value: 'uint32',
							},
							{
								name: 'FLOAT32 - IEEE 754 32-Bit Float',
								value: 'float32',
							},
							{
								name: 'SCALED - Raw Value with Scaling',
								value: 'scaled',
							},
						],
						default: 'int16',
						description: 'Data type for conversion',
					},
					{
						displayName: 'Byte Order',
						name: 'byteOrder',
						type: 'options',
						options: [
							{
								name: 'Big Endian (ABCD)',
								value: 'big_endian',
							},
							{
								name: 'Little Endian (DCBA)',
								value: 'little_endian',
							},
						],
						default: 'big_endian',
						description: 'Byte order for multi-register values',
					},
					{
						displayName: 'Word Swap',
						name: 'wordSwap',
						type: 'boolean',
						displayOptions: {
							show: {
								conversionMode: ['quick'],
								quickConvertType: ['float', 'long', 'double'],
							},
						},
						default: false,
						description: 'Swap the order of 16-bit words within multi-register values (ABCD→CDAB, DCBA→BADC)',
					},
					{
						displayName: 'Scale Factor',
						name: 'scaleFactor',
						type: 'number',
						displayOptions: {
							show: {
								dataType: ['scaled'],
							},
						},
						default: 1,
						description: 'Divide raw value by this factor',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						displayOptions: {
							show: {
								dataType: ['scaled'],
							},
						},
						default: 0,
						description: 'Add this value after scaling',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const conversionMode = this.getNodeParameter('conversionMode', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			try {
				let outputData: IDataObject = {};

				switch (conversionMode) {
					case 'quick':
						outputData = await executeQuickMode(this, item, itemIndex);
						break;
					case 'custom':
						outputData = await executeCustomMode(this, item, itemIndex);
						break;
				}

				returnData.push({
					json: outputData,
					pairedItem: { item: itemIndex },
				});

			} catch (error) {
				throw new NodeOperationError(this.getNode(), error.message, { itemIndex });
			}
		}

		return [returnData];
	}

}

async function executeQuickMode(context: IExecuteFunctions, item: INodeExecutionData, itemIndex: number): Promise<IDataObject> {
	const quickType = context.getNodeParameter('quickConvertType', itemIndex) as string;
	const byteOrder = context.getNodeParameter('quickByteOrder', itemIndex, 'BE') as string;
	const wordSwap = context.getNodeParameter('wordSwap', itemIndex, false) as boolean;
	const enableScaling = context.getNodeParameter('enableScaling', itemIndex, false) as boolean;
	const scaleFactorValue = context.getNodeParameter('scaleFactorValue', itemIndex, 1) as number;
	const longIntegerValue = context.getNodeParameter('longIntegerValue', itemIndex, 'signed') as string;
	
	// Get output options (now direct fields)
	const includeMetadata = context.getNodeParameter('includeMetadata', itemIndex, false) as boolean;
	const addTimestamp = context.getNodeParameter('addTimestamp', itemIndex, false) as boolean;
	const outputFieldName = context.getNodeParameter('outputFieldName', itemIndex, 'output') as string;
	const metadataFieldName = context.getNodeParameter('metadataFieldName', itemIndex, 'conversion') as string;

	// Extract registers
	const registers = extractRegisters(item.json);
	if (!registers || registers.length === 0) {
		throw new Error('No register data found in input');
	}

	// Start with clean output structure
	const result: IDataObject = {};
	const convertedData: IDataObject = {};
	const metadata: IDataObject = {};

	// Use scale factor directly
	const scaleFactor = enableScaling ? scaleFactorValue : 1;

	// Prepare metadata
	if (includeMetadata) {
		metadata.type = quickType;
		metadata.byteOrder = byteOrder;
		metadata.wordSwap = wordSwap;
		metadata.rawRegisters = registers;
		metadata.registerCount = registers.length;
		if (enableScaling) {
			metadata.scaleFactor = scaleFactor;
			metadata.scalingApplied = true;
		}
		if (quickType === 'long') {
			metadata.longIntegerValue = longIntegerValue;
		}
	}

	switch (quickType) {
		case 'single':
			if (registers.length >= 1) {
				const value = registers[0];
				convertedData.value = enableScaling ? value * scaleFactor : value;
				if (includeMetadata) metadata.dataType = 'int16';
			}
			break;

		case 'float':
			if (registers.length >= 2) {
				const floatResult = DataConversionUtils.convertData(registers, {
					name: 'value',
					startRegister: 0,
					dataType: 'float32',
					byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
					wordSwap: wordSwap,
				});
				if (floatResult.valid) {
					convertedData.value = enableScaling ? floatResult.value * scaleFactor : floatResult.value;
					if (includeMetadata) metadata.dataType = 'float32';
				}
			}
			break;

		case 'long':
			if (registers.length >= 2) {
				const int32Result = DataConversionUtils.convertData(registers, {
					name: 'value_signed',
					startRegister: 0,
					dataType: 'int32',
					byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
					wordSwap: wordSwap,
				});
				const uint32Result = DataConversionUtils.convertData(registers, {
					name: 'value_unsigned',
					startRegister: 0,
					dataType: 'uint32',
					byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
					wordSwap: wordSwap,
				});
				
				// Return values based on selection
				if (longIntegerValue === 'signed' && int32Result.valid) {
					convertedData.value = enableScaling ? int32Result.value * scaleFactor : int32Result.value;
					if (includeMetadata) metadata.dataType = 'int32';
				} else if (longIntegerValue === 'unsigned' && uint32Result.valid) {
					convertedData.value = enableScaling ? uint32Result.value * scaleFactor : uint32Result.value;
					if (includeMetadata) metadata.dataType = 'uint32';
				} else if (longIntegerValue === 'both') {
					// Return both values with descriptive names
					if (int32Result.valid) {
						convertedData.value_signed = enableScaling ? int32Result.value * scaleFactor : int32Result.value;
					}
					if (uint32Result.valid) {
						convertedData.value_unsigned = enableScaling ? uint32Result.value * scaleFactor : uint32Result.value;
					}
					if (includeMetadata) metadata.dataType = 'int32/uint32';
				}
			}
			break;

		case 'double':
			if (registers.length >= 4) {
				const doubleValue = convertToDouble(registers, byteOrder === 'BE');
				if (typeof doubleValue === 'number') {
					convertedData.value = enableScaling ? doubleValue * scaleFactor : doubleValue;
					if (includeMetadata) metadata.dataType = 'double';
				}
			}
			break;

		case 'bcd':
			if (registers.length >= 1) {
				const bcdValue = convertBCD(registers[0]);
				if (!isNaN(bcdValue)) {
					convertedData.value = enableScaling ? bcdValue * scaleFactor : bcdValue;
					if (includeMetadata) metadata.dataType = 'bcd';
				}
			}
			break;

		case 'bitfield':
			if (registers.length >= 1) {
				convertedData.bits = extractBits(registers[0]);
				if (includeMetadata) metadata.dataType = 'bitfield';
			}
			break;

		case 'all':
			// For 'all' mode, use special handling
			return organizeAllConversionsOutput(registers, byteOrder, wordSwap, enableScaling, scaleFactor, 
				includeMetadata, addTimestamp, outputFieldName, metadataFieldName);
	}

	// Organize final output
	result[outputFieldName] = convertedData;
	
	if (includeMetadata) {
		result[metadataFieldName] = metadata;
	}
	
	if (addTimestamp) {
		result.timestamp = new Date().toISOString();
	}

	return result;
}

async function executeCustomMode(context: IExecuteFunctions, item: INodeExecutionData, itemIndex: number): Promise<IDataObject> {
	const conversions = context.getNodeParameter('conversions', itemIndex, []) as any[];
	
	// Extract registers from input
	const registers = extractRegisters(item.json);
	if (!registers || registers.length === 0) {
		throw new Error('No register data found in input');
	}
	
	const output: IDataObject = {
		_raw_registers: registers,
		_register_count: registers.length,
	};
	
	// Process each conversion rule
	for (const conv of conversions) {
		if (!conv.name) continue;
		
		try {
			const rule = {
				name: conv.name,
				startRegister: conv.startRegister || 0,
				dataType: conv.dataType || 'int16',
				byteOrder: conv.byteOrder || 'big_endian',
				scaleFactor: conv.scaleFactor,
				offset: conv.offset,
			};
			
			const result = DataConversionUtils.convertData(registers, rule);
			
			if (result.valid) {
				output[conv.name] = result.value;
			} else {
				output[conv.name + '_error'] = result.error;
			}
		} catch (error) {
			output[conv.name + '_error'] = error.message;
		}
	}
	
	return output;
}

function extractRegisters(inputData: IDataObject): number[] | null {
	// Try common patterns from Modbus read nodes
	if (inputData.data && Array.isArray(inputData.data)) {
		return inputData.data as number[];
	}
	if (Array.isArray(inputData)) {
		return inputData as number[];
	}
	if (inputData.registers && Array.isArray(inputData.registers)) {
		return inputData.registers as number[];
	}
	if (inputData.values && Array.isArray(inputData.values)) {
		return inputData.values as number[];
	}
	return null;
}


function convertToDouble(registers: number[], bigEndian: boolean): number | null {
	if (registers.length < 4) return null;
	
	try {
		const buffer = Buffer.allocUnsafe(8);
		
		if (bigEndian) {
			buffer.writeUInt16BE(registers[0], 0);
			buffer.writeUInt16BE(registers[1], 2);
			buffer.writeUInt16BE(registers[2], 4);
			buffer.writeUInt16BE(registers[3], 6);
		} else {
			buffer.writeUInt16LE(registers[3], 0);
			buffer.writeUInt16LE(registers[2], 2);
			buffer.writeUInt16LE(registers[1], 4);
			buffer.writeUInt16LE(registers[0], 6);
		}
		
		return buffer.readDoubleLE(0);
	} catch {
		return null;
	}
}

function convertBCD(value: number): number {
	// Convert BCD (Binary Coded Decimal) to regular decimal
	let result = 0;
	let multiplier = 1;
	
	while (value > 0) {
		const digit = value & 0x0F;
		if (digit > 9) return NaN; // Invalid BCD
		result += digit * multiplier;
		multiplier *= 10;
		value >>= 4;
	}
	
	return result;
}

function extractBits(value: number): IDataObject {
	const bits: IDataObject = {};
	
	for (let i = 0; i < 16; i++) {
		bits[`bit_${i}`] = (value & (1 << i)) !== 0;
	}
	
	return bits;
}

function organizeAllConversionsOutput(
	registers: number[], 
	byteOrder: string, 
	wordSwap: boolean,
	enableScaling: boolean, 
	scaleFactor: number,
	includeMetadata: boolean, 
	addTimestamp: boolean, 
	outputFieldName: string, 
	metadataFieldName: string
): IDataObject {
	const result: IDataObject = {};
	const allConversions: IDataObject = {};
	
	// Single register conversions
	if (registers.length >= 1) {
		const reg = registers[0];
		allConversions.single_int16 = enableScaling ? reg * scaleFactor : reg;
		allConversions.single_uint16 = enableScaling ? (reg & 0xFFFF) * scaleFactor : (reg & 0xFFFF);
		allConversions.single_bcd = enableScaling ? convertBCD(reg) * scaleFactor : convertBCD(reg);
		allConversions.single_bits = extractBits(reg);
	}

	// Two register conversions
	if (registers.length >= 2) {
		const floatResult = DataConversionUtils.convertData(registers, {
			name: 'float32',
			startRegister: 0,
			dataType: 'float32',
			byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
			wordSwap: wordSwap,
		});
		const int32Result = DataConversionUtils.convertData(registers, {
			name: 'int32',
			startRegister: 0,
			dataType: 'int32',
			byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
			wordSwap: wordSwap,
		});
		const uint32Result = DataConversionUtils.convertData(registers, {
			name: 'uint32',
			startRegister: 0,
			dataType: 'uint32',
			byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
			wordSwap: wordSwap,
		});
		
		if (floatResult.valid) {
			allConversions.float32_value = enableScaling ? floatResult.value * scaleFactor : floatResult.value;
		}
		if (int32Result.valid) {
			allConversions.int32_value = enableScaling ? int32Result.value * scaleFactor : int32Result.value;
		}
		if (uint32Result.valid) {
			allConversions.uint32_value = enableScaling ? uint32Result.value * scaleFactor : uint32Result.value;
		}
	}

	// Four register conversions
	if (registers.length >= 4) {
		const doubleValue = convertToDouble(registers, byteOrder === 'BE');
		if (typeof doubleValue === 'number') {
			allConversions.double_value = enableScaling ? doubleValue * scaleFactor : doubleValue;
		}
	}

	// Organize final output
	result[outputFieldName] = allConversions;
	
	if (includeMetadata) {
		const metadata: IDataObject = {
			type: 'all',
			byteOrder: byteOrder,
			wordSwap: wordSwap,
			rawRegisters: registers,
			registerCount: registers.length,
		};
		if (enableScaling) {
			metadata.scaleFactor = scaleFactor;
			metadata.scalingApplied = true;
		}
		result[metadataFieldName] = metadata;
	}
	
	if (addTimestamp) {
		result.timestamp = new Date().toISOString();
	}

	return result;
}