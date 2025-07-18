import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { DataConversionUtils, ConversionRule, ConversionResult } from './DataConversionUtils';
import { ValidationUtils } from './ValidationUtils';

export interface NodeParameters {
	conversions: ConversionRule[];
	inputSource: 'data' | 'values' | 'registers' | 'custom_path';
	customPath?: string;
	outputFormat: 'individual_fields' | 'conversion_object' | 'both';
	addTimestamp: boolean;
	addMetadata: boolean;
	errorHandling: 'stop_on_error' | 'skip_invalid' | 'default_values';
	performanceMode: boolean;
}

export class ModbusDataConverter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Modbus Data Converter',
		name: 'modbusDataConverter',
		icon: 'file:modbus.svg',
		group: ['input'],
		version: 1,
		description: 'Convert raw Modbus register data into industrial standard data types',
		eventTriggerDescription: '',
		defaults: {
			name: 'Modbus Data Converter',
		},
		//@ts-ignore
		inputs: ['main'],
		//@ts-ignore
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Source',
				name: 'inputSource',
				type: 'options',
				options: [
					{
						name: 'Data Property',
						value: 'data',
						description: 'Use the "data" property from input',
					},
					{
						name: 'Values Array',
						value: 'values',
						description: 'Use input as array of values',
					},
					{
						name: 'Registers Property',
						value: 'registers',
						description: 'Use the "registers" property from input',
					},
					{
						name: 'Custom Path',
						value: 'custom_path',
						description: 'Use a custom property path',
					},
				],
				default: 'data',
				description: 'Where to find the Modbus register data in the input',
			},
			{
				displayName: 'Custom Path',
				name: 'customPath',
				type: 'string',
				displayOptions: {
					show: {
						inputSource: ['custom_path'],
					},
				},
				default: '',
				placeholder: 'e.g., response.data.registers',
				description: 'Dot notation path to the register data (e.g., response.data.registers)',
			},
			{
				displayName: 'Conversions',
				name: 'conversions',
				type: 'collection',
				placeholder: 'Add Conversion',
				default: {},
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

						description: 'Name for the converted value (used as output property)',
					},
					{
						displayName: 'Start Register',
						name: 'startRegister',
						type: 'number',
						default: 0,
						required: true,
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
							{
								name: 'BITFIELD - Extract Bits',
								value: 'bitfield',
							},
							{
								name: 'BCD - Binary Coded Decimal',
								value: 'bcd',
							},
						],
						default: 'int16',
						required: true,
						description: 'Data type for conversion',
					},
					{
						displayName: 'Byte Order',
						name: 'byteOrder',
						type: 'options',
						options: [
							{
								name: 'Big Endian (Motorola)',
								value: 'big_endian',
							},
							{
								name: 'Little Endian (Intel)',
								value: 'little_endian',
							},
						],
						default: 'big_endian',
						required: true,
						description: 'Byte order for multi-register conversions',
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
						description: 'Multiply raw value by this factor',
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
					{
						displayName: 'Bit Mask',
						name: 'bitMask',
						type: 'number',
						displayOptions: {
							show: {
								dataType: ['bitfield'],
							},
						},
						default: 0,
						description: 'Bit mask for extraction (e.g., 0x00FF)',
					},
					{
						displayName: 'Bit Position',
						name: 'bitPosition',
						type: 'number',
						displayOptions: {
							show: {
								dataType: ['bitfield'],
							},
						},
						default: 0,
						typeOptions: {
							minValue: 0,
							maxValue: 15,
						},
						description: 'Starting bit position (0-15)',
					},
					{
						displayName: 'Bit Length',
						name: 'bitLength',
						type: 'number',
						displayOptions: {
							show: {
								dataType: ['bitfield'],
							},
						},
						default: 1,
						typeOptions: {
							minValue: 1,
							maxValue: 16,
						},
						description: 'Number of bits to extract',
					},
					{
						displayName: 'Decimal Places',
						name: 'decimalPlaces',
						type: 'number',
						default: 2,
						typeOptions: {
							minValue: 0,
							maxValue: 10,
						},
						description: 'Number of decimal places for output',
					},
					{
						displayName: 'Enable Validation',
						name: 'enableValidation',
						type: 'boolean',
						default: false,
						description: 'Enable min/max validation for converted values',
					},
					{
						displayName: 'Validation Settings',
						name: 'validation',
						type: 'collection',
						displayOptions: {
							show: {
								enableValidation: [true],
							},
						},
						default: {},
						options: [
							{
								displayName: 'Minimum Value',
								name: 'min',
								type: 'number',
								default: 0,
								description: 'Minimum allowed value',
							},
							{
								displayName: 'Maximum Value',
								name: 'max',
								type: 'number',
								default: 100,
								description: 'Maximum allowed value',
							},
							{
								displayName: 'Allow NaN',
								name: 'allowNaN',
								type: 'boolean',
								default: false,
								description: 'Allow NaN values to pass validation',
							},
						],
					},
					{
						displayName: 'Enable Unit Conversion',
						name: 'enableUnitConversion',
						type: 'boolean',
						default: false,
						description: 'Enable unit conversion for the value',
					},
					{
						displayName: 'Unit Conversion',
						name: 'unitConversion',
						type: 'collection',
						displayOptions: {
							show: {
								enableUnitConversion: [true],
							},
						},
						default: {},
						options: [
							{
								displayName: 'From Unit',
								name: 'from',
								type: 'options',
								options: [
									// Temperature
									{ name: 'Celsius (°C)', value: 'celsius' },
									{ name: 'Fahrenheit (°F)', value: 'fahrenheit' },
									{ name: 'Kelvin (K)', value: 'kelvin' },
									// Pressure
									{ name: 'Pascal (Pa)', value: 'pascal' },
									{ name: 'Bar', value: 'bar' },
									{ name: 'PSI', value: 'psi' },
									{ name: 'Atmosphere', value: 'atm' },
									// Flow
									{ name: 'Liters per Minute (LPM)', value: 'lpm' },
									{ name: 'Gallons per Minute (GPM)', value: 'gpm' },
									{ name: 'Cubic Feet per Minute (CFM)', value: 'cfm' },
									{ name: 'Cubic Meters per Hour (CMH)', value: 'cmh' },
									// Power
									{ name: 'Watt (W)', value: 'watt' },
									{ name: 'Kilowatt (kW)', value: 'kilowatt' },
									{ name: 'Horsepower (Hp)', value: 'horsepower' },
									{ name: 'BTU per Hour', value: 'btu_h' },
									// Length
									{ name: 'Meter (M)', value: 'meter' },
									{ name: 'Foot (Ft)', value: 'foot' },
									{ name: 'Inch (In)', value: 'inch' },
									{ name: 'Millimeter (Mm)', value: 'millimeter' },
									// Mass
									{ name: 'Kilogram (Kg)', value: 'kilogram' },
									{ name: 'Pound (Lb)', value: 'pound' },
									{ name: 'Gram (G)', value: 'gram' },
								],
								default: 'celsius',
								description: 'Source unit',
							},
							{
								displayName: 'To Unit',
								name: 'to',
								type: 'options',
								options: [
									// Temperature
									{ name: 'Celsius (°C)', value: 'celsius' },
									{ name: 'Fahrenheit (°F)', value: 'fahrenheit' },
									{ name: 'Kelvin (K)', value: 'kelvin' },
									// Pressure
									{ name: 'Pascal (Pa)', value: 'pascal' },
									{ name: 'Bar', value: 'bar' },
									{ name: 'PSI', value: 'psi' },
									{ name: 'Atmosphere', value: 'atm' },
									// Flow
									{ name: 'Liters per Minute (LPM)', value: 'lpm' },
									{ name: 'Gallons per Minute (GPM)', value: 'gpm' },
									{ name: 'Cubic Feet per Minute (CFM)', value: 'cfm' },
									{ name: 'Cubic Meters per Hour (CMH)', value: 'cmh' },
									// Power
									{ name: 'Watt (W)', value: 'watt' },
									{ name: 'Kilowatt (kW)', value: 'kilowatt' },
									{ name: 'Horsepower (Hp)', value: 'horsepower' },
									{ name: 'BTU per Hour', value: 'btu_h' },
									// Length
									{ name: 'Meter (M)', value: 'meter' },
									{ name: 'Foot (Ft)', value: 'foot' },
									{ name: 'Inch (In)', value: 'inch' },
									{ name: 'Millimeter (Mm)', value: 'millimeter' },
									// Mass
									{ name: 'Kilogram (Kg)', value: 'kilogram' },
									{ name: 'Pound (Lb)', value: 'pound' },
									{ name: 'Gram (G)', value: 'gram' },
								],
								default: 'fahrenheit',
								description: 'Target unit',
							},
						],
					},
				],
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Individual Fields',
						value: 'individual_fields',
						description: 'Add each conversion as a separate property',
					},
					{
						name: 'Conversion Object',
						value: 'conversion_object',
						description: 'Add all conversions in a single object',
					},
					{
						name: 'Both',
						value: 'both',
						description: 'Add both individual fields and conversion object',
					},
				],
				default: 'individual_fields',
				description: 'How to format the output data',
			},
			{
				displayName: 'Add Timestamp',
				name: 'addTimestamp',
				type: 'boolean',
				default: true,
				description: 'Add timestamp to output data',
			},
			{
				displayName: 'Add Metadata',
				name: 'addMetadata',
				type: 'boolean',
				default: false,
				description: 'Add conversion metadata to output',
			},
			{
				displayName: 'Error Handling',
				name: 'errorHandling',
				type: 'options',
				options: [
					{
						name: 'Stop on Error',
						value: 'stop_on_error',
						description: 'Stop execution when conversion error occurs',
					},
					{
						name: 'Skip Invalid',
						value: 'skip_invalid',
						description: 'Skip invalid conversions and continue',
					},
					{
						name: 'Use Default Values',
						value: 'default_values',
						description: 'Use default values for failed conversions',
					},
				],
				default: 'skip_invalid',
				description: 'How to handle conversion errors',
			},
			{
				displayName: 'Performance Mode',
				name: 'performanceMode',
				type: 'boolean',
				default: false,
				description: 'Enable performance optimizations for large datasets',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get node parameters
		const parameters: NodeParameters = {
			conversions: this.getNodeParameter('conversions', 0) as ConversionRule[],
			inputSource: this.getNodeParameter('inputSource', 0) as string,
			customPath: this.getNodeParameter('customPath', 0) as string,
			outputFormat: this.getNodeParameter('outputFormat', 0) as string,
			addTimestamp: this.getNodeParameter('addTimestamp', 0) as boolean,
			addMetadata: this.getNodeParameter('addMetadata', 0) as boolean,
			errorHandling: this.getNodeParameter('errorHandling', 0) as string,
			performanceMode: this.getNodeParameter('performanceMode', 0) as boolean,
		} as NodeParameters;

		// Validate node parameters
		const parameterValidation = ValidationUtils.validateNodeParameters(parameters);
		if (!parameterValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				ValidationUtils.createErrorMessage(parameterValidation, 'Node parameters')
			);
		}

		// Process conversion rules
		const processedRules = processConversionRules(parameters.conversions);

		// Validate conversion rules
		const rulesValidation = ValidationUtils.validateConversionRules(processedRules);
		if (!rulesValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				ValidationUtils.createErrorMessage(rulesValidation, 'Conversion rules')
			);
		}

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			try {
				// Extract register data from input
				const inputValidation = ValidationUtils.validateInputData(
					item.json,
					parameters.inputSource,
					parameters.customPath
				);

				if (!inputValidation.valid) {
					if (parameters.errorHandling === 'stop_on_error') {
						throw new NodeOperationError(
							this.getNode(),
							ValidationUtils.createErrorMessage(inputValidation, `Input data for item ${itemIndex}`)
						);
					} else {
						// Skip this item or use default
						if (parameters.errorHandling === 'skip_invalid') {
							continue;
						}
						// Use default empty data
					}
				}

				const registers = extractRegisters(item.json, parameters);

				// Perform conversions
				const conversionResults = DataConversionUtils.convertMultiple(registers, processedRules);

				// Handle conversion errors
				const validResults = handleConversionErrors(
					conversionResults,
					parameters.errorHandling,
					itemIndex,
					this.getNode()
				);

				// Format output
				const outputData = formatOutput(
					validResults,
					parameters,
					item.json
				);

				returnData.push({
					json: outputData,
					pairedItem: { item: itemIndex },
				});

			} catch (error) {
				if (parameters.errorHandling === 'stop_on_error') {
					throw error;
				}
				// Skip this item for other error handling modes
			}
		}

		return [returnData];
	}

}

/**
 * Process conversion rules and handle UI-specific transformations
 */
function processConversionRules(conversions: any[]): ConversionRule[] {
		return conversions.map((conversion: any) => {
			const rule: ConversionRule = {
				name: conversion.name,
				startRegister: conversion.startRegister,
				dataType: conversion.dataType,
				byteOrder: conversion.byteOrder,
				scaleFactor: conversion.scaleFactor,
				offset: conversion.offset,
				decimalPlaces: conversion.decimalPlaces,
				bitMask: conversion.bitMask,
				bitPosition: conversion.bitPosition,
				bitLength: conversion.bitLength,
			};

			// Handle validation settings
			if (conversion.enableValidation && conversion.validation) {
				rule.validation = {
					enabled: true,
					min: conversion.validation.min,
					max: conversion.validation.max,
					allowNaN: conversion.validation.allowNaN,
				};
			}

			// Handle unit conversion
			if (conversion.enableUnitConversion && conversion.unitConversion) {
				rule.unitConversion = {
					from: conversion.unitConversion.from,
					to: conversion.unitConversion.to,
				};
			}

			return rule;
		});
}

/**
 * Extract registers from input data
 */
function extractRegisters(inputData: IDataObject, parameters: NodeParameters): number[] {
		let registers: number[] = [];

		switch (parameters.inputSource) {
			case 'data':
				if (Array.isArray(inputData.data)) {
					registers = inputData.data as number[];
				} else if (typeof inputData.data === 'number') {
					registers = [inputData.data as number];
				} else if (inputData.data && typeof inputData.data === 'number') {
					registers = [inputData.data as number];
				}
				break;
			case 'values':
				if (Array.isArray(inputData)) {
					registers = inputData as number[];
				}
				break;
			case 'registers':
				if (Array.isArray(inputData.registers)) {
					registers = inputData.registers as number[];
				} else if (typeof inputData.registers === 'number') {
					registers = [inputData.registers as number];
				}
				break;
			case 'custom_path':
				if (parameters.customPath) {
					const pathValue = getValueByPath(inputData, parameters.customPath);
					if (Array.isArray(pathValue)) {
						registers = pathValue;
					} else if (typeof pathValue === 'number') {
						registers = [pathValue];
					}
				}
				break;
		}

		return registers;
}

/**
 * Get value from object by dot notation path
 */
function getValueByPath(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => {
			return current && current[key] !== undefined ? current[key] : undefined;
		}, obj);
}

/**
 * Handle conversion errors based on error handling strategy
 */
function handleConversionErrors(
	results: ConversionResult[],
	errorHandling: string,
	itemIndex: number,
	node: any
): ConversionResult[] {
		const validResults: ConversionResult[] = [];
		const errors: string[] = [];

		for (const result of results) {
			if (result.valid) {
				validResults.push(result);
			} else {
				errors.push(`${result.name}: ${result.error}`);

				if (errorHandling === 'stop_on_error') {
					throw new NodeOperationError(
						node,
						`Conversion error in item ${itemIndex}: ${result.error}`
					);
				} else if (errorHandling === 'default_values') {
					// Create default value result
					const defaultResult: ConversionResult = {
						...result,
						value: getDefaultValue(result.dataType),
						valid: true,
						error: undefined,
					};
					validResults.push(defaultResult);
				}
				// For 'skip_invalid', we just don't add the result
			}
		}

		return validResults;
}

/**
 * Get default value for data type
 */
function getDefaultValue(dataType: string): any {
		switch (dataType) {
			case 'int16':
			case 'uint16':
			case 'int32':
			case 'uint32':
			case 'float32':
			case 'scaled':
				return 0;
			case 'bitfield':
				return false;
			case 'bcd':
				return 0;
			default:
				return null;
		}
}

/**
 * Format output data according to output format settings
 */
function formatOutput(
	results: ConversionResult[],
	parameters: NodeParameters,
	originalData: IDataObject
): IDataObject {
		const outputData: IDataObject = { ...originalData };

		// Add timestamp if requested
		if (parameters.addTimestamp) {
			outputData.timestamp = new Date().toISOString();
		}

		// Add individual fields
		if (parameters.outputFormat === 'individual_fields' || parameters.outputFormat === 'both') {
			results.forEach(result => {
				outputData[result.name] = result.value;
				
				if (parameters.addMetadata && result.metadata) {
					outputData[`${result.name}_metadata`] = result.metadata;
				}
			});
		}

		// Add conversion object
		if (parameters.outputFormat === 'conversion_object' || parameters.outputFormat === 'both') {
			const conversions: IDataObject = {};
			
			results.forEach(result => {
				conversions[result.name] = {
					value: result.value,
					originalValue: result.originalValue,
					dataType: result.dataType,
					valid: result.valid,
					...(parameters.addMetadata && result.metadata ? { metadata: result.metadata } : {}),
				};
			});

			outputData.conversions = conversions;
		}

		return outputData;
}