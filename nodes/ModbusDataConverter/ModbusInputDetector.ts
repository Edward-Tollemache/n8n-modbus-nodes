import type { IDataObject } from 'n8n-workflow';

export interface ModbusNodeOutput {
	functionCode: string;
	address: number;
	quantity: number;
	data: number[];
}

export interface DetectionResult {
	isModbusData: boolean;
	functionCode?: string;
	startAddress?: number;
	registerCount?: number;
	data?: number[];
	suggestedConversions?: SuggestedConversion[];
}

export interface SuggestedConversion {
	name: string;
	dataType: string;
	startRegister: number;
	confidence: number;
	reason: string;
}

export class ModbusInputDetector {
	/**
	 * Detect if input data is from a Modbus node
	 */
	static detectModbusInput(inputData: IDataObject): DetectionResult {
		// Check for standard Modbus node output structure
		if (inputData.functionCode && inputData.data && Array.isArray(inputData.data)) {
			const modbusData = inputData as unknown as ModbusNodeOutput;
			return {
				isModbusData: true,
				functionCode: modbusData.functionCode,
				startAddress: modbusData.address,
				registerCount: modbusData.quantity,
				data: modbusData.data,
				suggestedConversions: this.suggestConversions(modbusData),
			};
		}

		// Check for array of Modbus outputs (batch read)
		if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].functionCode) {
			const firstItem = inputData[0] as unknown as ModbusNodeOutput;
			return {
				isModbusData: true,
				functionCode: firstItem.functionCode,
				startAddress: firstItem.address,
				registerCount: firstItem.quantity,
				data: firstItem.data,
				suggestedConversions: this.suggestConversions(firstItem),
			};
		}

		// Not Modbus data
		return { isModbusData: false };
	}

	/**
	 * Suggest conversions based on common industrial patterns
	 */
	private static suggestConversions(modbusData: ModbusNodeOutput): SuggestedConversion[] {
		const suggestions: SuggestedConversion[] = [];
		const { data, functionCode } = modbusData;

		// For coils and discrete inputs (FC1, FC2), suggest boolean conversion
		if (functionCode === 'FC1' || functionCode === 'FC2') {
			suggestions.push({
				name: 'status_bits',
				dataType: 'bitfield',
				startRegister: 0,
				confidence: 1.0,
				reason: 'Coil/Discrete input data is typically boolean',
			});
			return suggestions;
		}

		// For holding/input registers (FC3, FC4)
		if (!data || data.length === 0) return suggestions;

		// Check for common patterns
		
		// Pattern 1: Two consecutive registers with values that suggest float32
		if (data.length >= 2) {
			// Check for typical float32 patterns (e.g., temperature, pressure)
			const possibleFloat = this.checkFloat32Pattern(data[0], data[1]);
			if (possibleFloat.isLikely) {
				suggestions.push({
					name: possibleFloat.suggestedName,
					dataType: 'float32',
					startRegister: 0,
					confidence: possibleFloat.confidence,
					reason: possibleFloat.reason,
				});
			}
		}

		// Pattern 2: Single register with reasonable int16 value
		if (data.length >= 1) {
			const value = data[0];
			if (value >= -1000 && value <= 1000) {
				suggestions.push({
					name: 'analog_value',
					dataType: 'int16',
					startRegister: 0,
					confidence: 0.7,
					reason: 'Value is in typical analog sensor range',
				});
			}
		}

		// Pattern 3: Large values suggesting scaled integers
		if (data.some(val => Math.abs(val) > 10000)) {
			suggestions.push({
				name: 'scaled_value',
				dataType: 'scaled',
				startRegister: 0,
				confidence: 0.6,
				reason: 'Large values often indicate scaling is needed',
			});
		}

		// Pattern 4: Multiple registers suggesting int32/uint32
		if (data.length >= 2 && (data[0] > 32767 || data[1] > 0)) {
			suggestions.push({
				name: 'counter_value',
				dataType: 'uint32',
				startRegister: 0,
				confidence: 0.5,
				reason: 'Multiple registers with high values suggest 32-bit counter',
			});
		}

		return suggestions;
	}

	/**
	 * Check if two registers likely form a float32 value
	 */
	private static checkFloat32Pattern(reg1: number, reg2: number): {
		isLikely: boolean;
		confidence: number;
		suggestedName: string;
		reason: string;
	} {
		// Convert to float32 assuming big endian
		// Handle signed values properly (Modbus registers can be negative)
		const buffer = Buffer.alloc(4);
		buffer.writeInt16BE(reg1, 0);  // Use signed write
		buffer.writeInt16BE(reg2, 2);  // Use signed write
		const floatValue = buffer.readFloatBE(0);

		// Check if the float value is reasonable
		if (!isNaN(floatValue) && isFinite(floatValue)) {
			// Temperature range check (-50 to 150)
			if (floatValue >= -50 && floatValue <= 150) {
				return {
					isLikely: true,
					confidence: 0.8,
					suggestedName: 'temperature',
					reason: `Value ${floatValue.toFixed(2)} is in typical temperature range`,
				};
			}
			// Pressure range check (0 to 1000)
			if (floatValue >= 0 && floatValue <= 1000) {
				return {
					isLikely: true,
					confidence: 0.7,
					suggestedName: 'pressure',
					reason: `Value ${floatValue.toFixed(2)} is in typical pressure range`,
				};
			}
			// General float check
			if (floatValue >= -10000 && floatValue <= 10000) {
				return {
					isLikely: true,
					confidence: 0.5,
					suggestedName: 'measurement',
					reason: 'Value appears to be a valid floating-point measurement',
				};
			}
		}

		return {
			isLikely: false,
			confidence: 0,
			suggestedName: '',
			reason: '',
		};
	}

	/**
	 * Get common device templates based on register patterns
	 */
	static getDeviceTemplate(data: number[], deviceHint?: string): ConversionTemplate | null {
		// This would contain common industrial device templates
		// For now, returning null, but could be expanded with templates
		return null;
	}
}

export interface ConversionTemplate {
	name: string;
	description: string;
	conversions: Array<{
		name: string;
		dataType: string;
		startRegister: number;
		scaleFactor?: number;
		unitConversion?: {
			from: string;
			to: string;
		};
	}>;
}