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
		displayName: 'Modbus Data Converter',
		name: 'modbusDataConverter',
		icon: 'file:modbus.svg',
		group: ['transform'],
		version: 2,
		description: 'Convert Modbus register data with auto-detection and simple options',
		eventTriggerDescription: '',
		defaults: {
			name: 'Modbus Data Converter',
		},
		//@ts-ignore
		inputs: ['main'],
		//@ts-ignore
		outputs: ['main'],
		properties: [
			// Simplified Mode Selection
			{
				displayName: 'Conversion Mode',
				name: 'conversionMode',
				type: 'options',
				options: [
					{
						name: 'Quick Convert',
						value: 'quick',
						description: 'Simple conversions with basic options',
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
						name: 'All Common Types',
						value: 'all',
						description: 'Show all possible conversions',
					},
				],
				default: 'float',
			},


			// Simple Options
			{
				displayName: 'Options',
				name: 'simpleOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						conversionMode: ['quick'],
					},
				},
				options: [
					{
						displayName: 'Byte Order',
						name: 'byteOrder',
						type: 'options',
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
					{
						displayName: 'Add Raw Data',
						name: 'includeRaw',
						type: 'boolean',
						default: false,
						description: 'Include original register values in output',
					},
					{
						displayName: 'Add Metadata',
						name: 'includeMetadata',
						type: 'boolean',
						default: false,
						description: 'Include conversion information in output',
					},
				],
			},

			// Custom Conversion Rules (existing implementation)
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

			// Input Source (simplified)
			{
				displayName: 'Input Source',
				name: 'inputSource',
				type: 'options',
				displayOptions: {
					show: {
						conversionMode: ['custom'],
					},
				},
				options: [
					{
						name: 'Auto-Detect',
						value: 'auto',
						description: 'Automatically find register data',
					},
					{
						name: 'Data Property',
						value: 'data',
					},
					{
						name: 'Custom Path',
						value: 'custom_path',
					},
				],
				default: 'auto',
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
		const options = context.getNodeParameter('simpleOptions', itemIndex, {}) as IDataObject;
		const byteOrder = (options.byteOrder as string) || 'BE';

		// Extract registers
		const registers = extractRegistersSimple(item.json);
		if (!registers || registers.length === 0) {
			throw new Error('No register data found');
		}

		const output: IDataObject = {};

		switch (quickType) {
			case 'single':
				if (registers.length >= 1) {
					output.value = registers[0];
					output.scaled_100 = registers[0] / 100;
					output.scaled_1000 = registers[0] / 1000;
				}
				break;

			case 'float':
				if (registers.length >= 2) {
					const floatResult = DataConversionUtils.convertData(registers, {
						name: 'value',
						startRegister: 0,
						dataType: 'float32',
						byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
					});
					if (floatResult.valid) {
						output.value = floatResult.value;
						output.type = 'float32';
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
					});
					const uint32Result = DataConversionUtils.convertData(registers, {
						name: 'value_unsigned',
						startRegister: 0,
						dataType: 'uint32',
						byteOrder: byteOrder === 'BE' ? 'big_endian' : 'little_endian',
					});
					if (int32Result.valid) {
						output.value_signed = int32Result.value;
						output.value_unsigned = uint32Result.value;
						output.type = 'int32/uint32';
					}
				}
				break;

			case 'all':
				// Show all common conversions
				const allResult: IDataObject = {
					first_register: registers[0],
				};
				
				// Single register conversions
				if (registers.length >= 1) {
					allResult.int16_value = registers[0];
					allResult.uint16_value = registers[0] & 0xFFFF;
					allResult.scaled_100 = registers[0] / 100;
					allResult.scaled_1000 = registers[0] / 1000;
				}
				
				// Two register conversions
				if (registers.length >= 2) {
					const floatResult = DataConversionUtils.convertData(registers, {
						name: 'float32',
						startRegister: 0,
						dataType: 'float32',
						byteOrder: 'big_endian',
					});
					const int32Result = DataConversionUtils.convertData(registers, {
						name: 'int32',
						startRegister: 0,
						dataType: 'int32',
						byteOrder: 'big_endian',
					});
					const uint32Result = DataConversionUtils.convertData(registers, {
						name: 'uint32',
						startRegister: 0,
						dataType: 'uint32',
						byteOrder: 'big_endian',
					});
					
					if (floatResult.valid) allResult.float32_value = floatResult.value;
					if (int32Result.valid) allResult.int32_value = int32Result.value;
					if (uint32Result.valid) allResult.uint32_value = uint32Result.value;
				}
				
				return allResult;
		}

		if (options.includeRaw) {
			output._raw = registers;
		}

		return output;
}


async function executeCustomMode(context: IExecuteFunctions, item: INodeExecutionData, itemIndex: number): Promise<IDataObject> {
		const conversions = context.getNodeParameter('conversions', itemIndex, []) as any[];
		const inputSource = context.getNodeParameter('inputSource', itemIndex, 'auto') as string;
		
		// Extract registers from input
		let registers: number[];
		
		if (inputSource === 'auto') {
			registers = extractRegistersSimple(item.json) || [];
		} else if (inputSource === 'data') {
			registers = (item.json.data as number[]) || [];
		} else {
			// Custom path handling could be added here
			registers = extractRegistersSimple(item.json) || [];
		}
		
		if (registers.length === 0) {
			throw new Error('No register data found');
		}
		
		const output: IDataObject = {
			_registers: registers,
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

function extractRegistersSimple(inputData: IDataObject): number[] | null {
		// Try common patterns
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