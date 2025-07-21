
export interface ConversionRule {
	name: string;
	startRegister: number;
	dataType: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'scaled' | 'bitfield' | 'bcd';
	byteOrder: 'big_endian' | 'little_endian';
	wordSwap?: boolean;
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

export interface ConversionResult {
	name: string;
	value: any;
	originalValue?: any;
	dataType: string;
	valid: boolean;
	error?: string;
	metadata?: {
		scaleFactor?: number;
		offset?: number;
		byteOrder: string;
		unitConversion?: string;
	};
}

export class DataConversionUtils {
	/**
	 * Convert raw Modbus register data based on conversion rules
	 */
	static convertData(registers: number[], rule: ConversionRule): ConversionResult {
		try {
			const result: ConversionResult = {
				name: rule.name,
				value: null,
				originalValue: null,
				dataType: rule.dataType,
				valid: false,
				metadata: {
					byteOrder: rule.byteOrder,
					scaleFactor: rule.scaleFactor,
					offset: rule.offset,
					unitConversion: rule.unitConversion ? `${rule.unitConversion.from} to ${rule.unitConversion.to}` : undefined,
				},
			};

			// Validate register availability
			const requiredRegisters = this.getRequiredRegisters(rule.dataType);
			if (registers.length < rule.startRegister + requiredRegisters) {
				result.error = `Not enough registers available. Required: ${requiredRegisters}, Available: ${registers.length - rule.startRegister}`;
				return result;
			}

			// Extract registers for conversion
			const dataRegisters = registers.slice(rule.startRegister, rule.startRegister + requiredRegisters);
			result.originalValue = dataRegisters.length === 1 ? dataRegisters[0] : dataRegisters;

			// Perform conversion based on data type
			switch (rule.dataType) {
				case 'int16':
					result.value = this.convertInt16(dataRegisters[0], rule.byteOrder);
					break;
				case 'uint16':
					result.value = this.convertUint16(dataRegisters[0], rule.byteOrder);
					break;
				case 'int32':
					result.value = this.convertInt32(dataRegisters, rule.byteOrder, rule.wordSwap);
					break;
				case 'uint32':
					result.value = this.convertUint32(dataRegisters, rule.byteOrder, rule.wordSwap);
					break;
				case 'float32':
					result.value = this.convertFloat32(dataRegisters, rule.byteOrder, rule.wordSwap);
					break;
				case 'scaled':
					result.value = this.convertScaled(dataRegisters[0], rule);
					break;
				case 'bitfield':
					result.value = this.convertBitfield(dataRegisters[0], rule);
					break;
				case 'bcd':
					result.value = this.convertBCD(dataRegisters[0], rule.byteOrder);
					break;
				default:
					result.error = `Unsupported data type: ${rule.dataType}`;
					return result;
			}

			// Apply unit conversion if specified
			if (rule.unitConversion && typeof result.value === 'number') {
				result.value = this.applyUnitConversion(result.value, rule.unitConversion);
			}

			// Apply decimal places rounding
			if (rule.decimalPlaces !== undefined && typeof result.value === 'number') {
				result.value = Number(result.value.toFixed(rule.decimalPlaces));
			}

			// Validate result
			if (rule.validation?.enabled) {
				const validation = this.validateValue(result.value, rule.validation);
				result.valid = validation.valid;
				if (!validation.valid) {
					result.error = validation.error;
				}
			} else {
				result.valid = true;
			}

			return result;
		} catch (error) {
			return {
				name: rule.name,
				value: null,
				originalValue: null,
				dataType: rule.dataType,
				valid: false,
				error: error instanceof Error ? error.message : 'Unknown conversion error',
				metadata: {
					byteOrder: rule.byteOrder,
				},
			};
		}
	}

	/**
	 * Get number of registers required for a data type
	 */
	private static getRequiredRegisters(dataType: string): number {
		switch (dataType) {
			case 'int16':
			case 'uint16':
			case 'scaled':
			case 'bitfield':
			case 'bcd':
				return 1;
			case 'int32':
			case 'uint32':
			case 'float32':
				return 2;
			default:
				return 1;
		}
	}

	/**
	 * Convert single register to signed 16-bit integer
	 */
	private static convertInt16(register: number, byteOrder: string): number {
		// Convert unsigned 16-bit to signed 16-bit
		if (register > 32767) {
			return register - 65536;
		}
		return register;
	}

	/**
	 * Convert single register to unsigned 16-bit integer
	 */
	private static convertUint16(register: number, byteOrder: string): number {
		return register & 0xFFFF;
	}

	/**
	 * Convert two registers to signed 32-bit integer
	 */
	private static convertInt32(registers: number[], byteOrder: string, wordSwap: boolean = false): number {
		// Apply word swap if requested
		const reg0 = wordSwap ? registers[1] : registers[0];
		const reg1 = wordSwap ? registers[0] : registers[1];

		let value: number;
		
		if (byteOrder === 'big_endian') {
			// High register first, then low register
			value = (reg0 << 16) | reg1;
		} else {
			// Little endian: low register first, then high register
			value = (reg1 << 16) | reg0;
		}

		// Convert to signed 32-bit
		if (value > 2147483647) {
			return value - 4294967296;
		}
		return value;
	}

	/**
	 * Convert two registers to unsigned 32-bit integer
	 */
	private static convertUint32(registers: number[], byteOrder: string, wordSwap: boolean = false): number {
		// Apply word swap if requested
		const reg0 = wordSwap ? registers[1] : registers[0];
		const reg1 = wordSwap ? registers[0] : registers[1];

		if (byteOrder === 'big_endian') {
			return ((reg0 << 16) | reg1) >>> 0;
		} else {
			return ((reg1 << 16) | reg0) >>> 0;
		}
	}

	/**
	 * Convert two registers to IEEE 754 32-bit float
	 */
	private static convertFloat32(registers: number[], byteOrder: string, wordSwap: boolean = false): number {
		const buffer = new ArrayBuffer(4);
		const view = new DataView(buffer);

		// Apply word swap if requested
		const reg0 = wordSwap ? registers[1] : registers[0];
		const reg1 = wordSwap ? registers[0] : registers[1];

		if (byteOrder === 'big_endian') {
			view.setUint16(0, reg0, false);
			view.setUint16(2, reg1, false);
		} else {
			view.setUint16(0, reg1, false);
			view.setUint16(2, reg0, false);
		}

		return view.getFloat32(0, false);
	}

	/**
	 * Convert register with scaling and offset
	 */
	private static convertScaled(register: number, rule: ConversionRule): number {
		let value = register;

		// Apply scale factor
		if (rule.scaleFactor !== undefined) {
			value *= rule.scaleFactor;
		}

		// Apply offset
		if (rule.offset !== undefined) {
			value += rule.offset;
		}

		return value;
	}

	/**
	 * Extract bits from register
	 */
	private static convertBitfield(register: number, rule: ConversionRule): any {
		if (rule.bitMask !== undefined) {
			// Use bit mask
			const result = register & rule.bitMask;
			return result;
		} else if (rule.bitPosition !== undefined) {
			// Extract specific bit range
			const bitLength = rule.bitLength || 1;
			const mask = (1 << bitLength) - 1;
			const result = (register >> rule.bitPosition) & mask;
			
			if (bitLength === 1) {
				return Boolean(result);
			}
			return result;
		}
		
		// Return whole register as bits
		return register;
	}

	/**
	 * Convert BCD to decimal
	 */
	private static convertBCD(register: number, byteOrder: string): number {
		const high = (register >> 8) & 0xFF;
		const low = register & 0xFF;
		
		const highDecimal = ((high >> 4) & 0x0F) * 10 + (high & 0x0F);
		const lowDecimal = ((low >> 4) & 0x0F) * 10 + (low & 0x0F);
		
		return highDecimal * 100 + lowDecimal;
	}

	/**
	 * Apply unit conversion
	 */
	private static applyUnitConversion(value: number, conversion: { from: string; to: string }): number {
		// Common industrial unit conversions
		const conversionMap: { [key: string]: (val: number) => number } = {
			// Temperature
			'celsius_to_fahrenheit': (val: number) => (val * 9/5) + 32,
			'fahrenheit_to_celsius': (val: number) => (val - 32) * 5/9,
			'celsius_to_kelvin': (val: number) => val + 273.15,
			'kelvin_to_celsius': (val: number) => val - 273.15,
			
			// Pressure
			'psi_to_bar': (val: number) => val * 0.0689476,
			'bar_to_psi': (val: number) => val * 14.5038,
			'pascal_to_bar': (val: number) => val * 0.00001,
			'bar_to_pascal': (val: number) => val * 100000,
			
			// Flow
			'gpm_to_lpm': (val: number) => val * 3.78541,
			'lpm_to_gpm': (val: number) => val * 0.264172,
			'cfm_to_cmh': (val: number) => val * 1.69901,
			'cmh_to_cfm': (val: number) => val * 0.588578,
			
			// Power
			'hp_to_kw': (val: number) => val * 0.745699,
			'kw_to_hp': (val: number) => val * 1.34102,
			'btu_to_kw': (val: number) => val * 0.000293071,
			'kw_to_btu': (val: number) => val * 3412.14,
		};

		const conversionKey = `${conversion.from}_to_${conversion.to}`;
		const converter = conversionMap[conversionKey];
		
		if (converter) {
			return converter(value);
		}
		
		// If no conversion found, return original value
		return value;
	}

	/**
	 * Validate converted value
	 */
	private static validateValue(value: any, validation: NonNullable<ConversionRule['validation']>): { valid: boolean; error?: string } {
		if (typeof value === 'number') {
			if (isNaN(value) && !validation.allowNaN) {
				return { valid: false, error: 'Value is NaN' };
			}
			
			if (validation.min !== undefined && value < validation.min) {
				return { valid: false, error: `Value ${value} is below minimum ${validation.min}` };
			}
			
			if (validation.max !== undefined && value > validation.max) {
				return { valid: false, error: `Value ${value} is above maximum ${validation.max}` };
			}
		}
		
		return { valid: true };
	}

	/**
	 * Batch process multiple conversion rules
	 */
	static convertMultiple(registers: number[], rules: ConversionRule[]): ConversionResult[] {
		return rules.map(rule => this.convertData(registers, rule));
	}
}