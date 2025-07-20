import type { IDataObject } from 'n8n-workflow';
import { DataConversionUtils, ConversionRule } from './DataConversionUtils';

export interface QuickConvertOptions {
	autoDetect?: boolean;
	preset?: string;
	customRules?: ConversionRule[];
}

export interface QuickConvertResult {
	success: boolean;
	data?: IDataObject;
	errors?: string[];
	metadata?: {
		detectedType?: string;
		appliedPreset?: string;
		conversionsApplied?: number;
	};
}

export class QuickConvert {
	/**
	 * Simple one-line conversion for common cases
	 */
	static convert(input: any, options: QuickConvertOptions = {}): QuickConvertResult {
		try {
			// Extract register data
			const registers = this.extractRegisters(input);
			if (!registers || registers.length === 0) {
				return {
					success: false,
					errors: ['No register data found in input'],
				};
			}

			// Auto-detect if enabled
			if (options.autoDetect) {
				return this.autoConvert(registers, input);
			}

			// Apply preset if specified
			if (options.preset) {
				return this.presetConvert(registers, options.preset);
			}

			// Apply custom rules if provided
			if (options.customRules && options.customRules.length > 0) {
				return this.customConvert(registers, options.customRules);
			}

			// Default: try common conversions
			return this.commonConvert(registers);
		} catch (error) {
			return {
				success: false,
				errors: [error.message],
			};
		}
	}

	/**
	 * Extract registers from various input formats
	 */
	private static extractRegisters(input: any): number[] | null {
		// Direct array
		if (Array.isArray(input)) {
			return input.filter(v => typeof v === 'number');
		}

		// Modbus node output
		if (input.data && Array.isArray(input.data)) {
			return input.data;
		}

		// Nested in json property
		if (input.json?.data && Array.isArray(input.json.data)) {
			return input.json.data;
		}

		// Single value
		if (typeof input === 'number') {
			return [input];
		}

		return null;
	}

	/**
	 * Auto-detect and convert based on patterns
	 */
	private static autoConvert(registers: number[], originalInput: any): QuickConvertResult {
		const result: IDataObject = {};
		const metadata: any = {
			detectedType: 'auto',
			conversionsApplied: 0,
		};

		// Single register - likely int16 or scaled
		if (registers.length === 1) {
			const value = registers[0];
			if (value >= -32768 && value <= 32767) {
				result.value = value;
				result.raw = value;
				
				// Check if it needs scaling
				if (Math.abs(value) > 1000) {
					result.scaled = value / 100; // Common scaling factor
				}
				metadata.conversionsApplied = 1;
			}
		}

		// Two registers - likely float32 or int32
		if (registers.length >= 2) {
			// Try float32 first
			const floatRule: ConversionRule = {
				name: 'value',
				startRegister: 0,
				dataType: 'float32',
				byteOrder: 'big_endian',
			};
			const floatResult = DataConversionUtils.convertData(registers, floatRule);
			if (floatResult.valid && !isNaN(floatResult.value) && 
				Math.abs(floatResult.value) < 10000) {
				result.value = floatResult.value;
				result.type = 'float32';
				metadata.detectedType = 'float32';
				metadata.conversionsApplied = 1;

				// Guess common meanings
				if (floatResult.value >= -50 && floatResult.value <= 150) {
					result.temperature_celsius = floatResult.value;
					result.temperature_fahrenheit = (floatResult.value * 9/5) + 32;
				} else if (floatResult.value >= 0 && floatResult.value <= 1000) {
					result.pressure = floatResult.value;
				}
			} else {
				// Try int32
				const int32Rule: ConversionRule = {
					name: 'value',
					startRegister: 0,
					dataType: 'int32',
					byteOrder: 'big_endian',
				};
				const int32Result = DataConversionUtils.convertData(registers, int32Rule);
				if (int32Result.valid) {
					result.value = int32Result.value;
					result.type = 'int32';
					metadata.detectedType = 'int32';
					metadata.conversionsApplied = 1;
				}
			}
		}

		// Multiple registers - show first few conversions
		if (registers.length > 2) {
			result.registers = registers;
			result.register_count = registers.length;
			
			// Convert first few as different types for preview
			const previewFloat = DataConversionUtils.convertData(registers, {
				name: 'preview_float',
				startRegister: 0,
				dataType: 'float32',
				byteOrder: 'big_endian',
			});
			const previewInt32 = DataConversionUtils.convertData(registers, {
				name: 'preview_int32',
				startRegister: 0,
				dataType: 'int32',
				byteOrder: 'big_endian',
			});
			
			result.preview = {
				first_as_int16: registers[0],
				first_two_as_float32: previewFloat.value,
				first_two_as_int32: previewInt32.value,
			};
		}

		// Include original Modbus metadata if available
		if (originalInput.functionCode) {
			result.modbus_info = {
				function_code: originalInput.functionCode,
				address: originalInput.address,
				quantity: originalInput.quantity,
			};
		}

		return {
			success: true,
			data: result,
			metadata,
		};
	}

	/**
	 * Convert using a preset
	 */
	private static presetConvert(registers: number[], presetId: string): QuickConvertResult {
		// This would use the ConversionPresets class
		// For now, returning a basic result
		return {
			success: false,
			errors: ['Preset conversion not yet implemented'],
		};
	}

	/**
	 * Convert using custom rules
	 */
	private static customConvert(registers: number[], rules: ConversionRule[]): QuickConvertResult {
		const results = DataConversionUtils.convertMultiple(registers, rules);
		const data: IDataObject = {};
		const errors: string[] = [];

		for (const result of results) {
			if (result.valid) {
				data[result.name] = result.value;
			} else {
				errors.push(`${result.name}: ${result.error}`);
			}
		}

		return {
			success: errors.length === 0,
			data,
			errors: errors.length > 0 ? errors : undefined,
			metadata: {
				conversionsApplied: results.filter(r => r.valid).length,
			},
		};
	}

	/**
	 * Apply common conversions
	 */
	private static commonConvert(registers: number[]): QuickConvertResult {
		const result: IDataObject = {
			raw: registers,
			count: registers.length,
		};

		// Common single register conversions
		if (registers.length >= 1) {
			result.register_0 = {
				int16: registers[0],
				uint16: registers[0] & 0xFFFF,
				scaled_100: registers[0] / 100,
				scaled_1000: registers[0] / 1000,
			};
		}

		// Common two register conversions
		if (registers.length >= 2) {
			const float32 = DataConversionUtils.convertData(registers, {
				name: 'float32',
				startRegister: 0,
				dataType: 'float32',
				byteOrder: 'big_endian',
			});
			const int32 = DataConversionUtils.convertData(registers, {
				name: 'int32',
				startRegister: 0,
				dataType: 'int32',
				byteOrder: 'big_endian',
			});
			const uint32 = DataConversionUtils.convertData(registers, {
				name: 'uint32',
				startRegister: 0,
				dataType: 'uint32',
				byteOrder: 'big_endian',
			});
			
			result.registers_0_1 = {
				float32_be: float32.value,
				int32_be: int32.value,
				uint32_be: uint32.value,
			};
		}

		return {
			success: true,
			data: result,
			metadata: {
				detectedType: 'common',
				conversionsApplied: Object.keys(result).length,
			},
		};
	}
}