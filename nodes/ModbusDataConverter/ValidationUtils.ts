import { ConversionRule } from './DataConversionUtils';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export class ValidationUtils {
	/**
	 * Validate conversion rule configuration
	 */
	static validateConversionRule(rule: ConversionRule, index: number): ValidationResult {
		const result: ValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
		};

		// Validate required fields
		if (!rule.name || rule.name.trim() === '') {
			result.errors.push(`Rule ${index + 1}: Name is required`);
		}

		if (rule.startRegister === undefined || rule.startRegister < 0) {
			result.errors.push(`Rule ${index + 1}: Start register must be >= 0`);
		}

		if (!rule.dataType) {
			result.errors.push(`Rule ${index + 1}: Data type is required`);
		}

		if (!rule.byteOrder) {
			result.errors.push(`Rule ${index + 1}: Byte order is required`);
		}

		// Validate data type specific requirements
		if (rule.dataType) {
			switch (rule.dataType) {
				case 'scaled':
					if (rule.scaleFactor === undefined && rule.offset === undefined) {
						result.warnings.push(`Rule ${index + 1}: Scaled conversion without scale factor or offset`);
					}
					break;
				case 'bitfield':
					if (rule.bitMask === undefined && rule.bitPosition === undefined) {
						result.errors.push(`Rule ${index + 1}: Bitfield conversion requires bit mask or bit position`);
					}
					if (rule.bitPosition !== undefined && (rule.bitPosition < 0 || rule.bitPosition > 15)) {
						result.errors.push(`Rule ${index + 1}: Bit position must be between 0 and 15`);
					}
					if (rule.bitLength !== undefined && (rule.bitLength < 1 || rule.bitLength > 16)) {
						result.errors.push(`Rule ${index + 1}: Bit length must be between 1 and 16`);
					}
					break;
				case 'float32':
				case 'int32':
				case 'uint32':
					// These require 2 registers
					break;
				default:
					if (!['int16', 'uint16', 'bcd'].includes(rule.dataType)) {
						result.errors.push(`Rule ${index + 1}: Unsupported data type '${rule.dataType}'`);
					}
			}
		}

		// Validate validation settings
		if (rule.validation?.enabled) {
			const validation = rule.validation;
			if (validation.min !== undefined && validation.max !== undefined) {
				if (validation.min > validation.max) {
					result.errors.push(`Rule ${index + 1}: Validation minimum cannot be greater than maximum`);
				}
			}
		}

		// Validate unit conversion
		if (rule.unitConversion) {
			if (!rule.unitConversion.from || !rule.unitConversion.to) {
				result.errors.push(`Rule ${index + 1}: Unit conversion requires both 'from' and 'to' units`);
			}
			if (rule.unitConversion.from === rule.unitConversion.to) {
				result.warnings.push(`Rule ${index + 1}: Unit conversion from and to are the same`);
			}
		}

		// Validate decimal places
		if (rule.decimalPlaces !== undefined && (rule.decimalPlaces < 0 || rule.decimalPlaces > 10)) {
			result.errors.push(`Rule ${index + 1}: Decimal places must be between 0 and 10`);
		}

		result.valid = result.errors.length === 0;
		return result;
	}

	/**
	 * Validate array of conversion rules
	 */
	static validateConversionRules(rules: ConversionRule[]): ValidationResult {
		const result: ValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
		};

		if (!Array.isArray(rules)) {
			result.errors.push('Conversion rules must be an array');
			result.valid = false;
			return result;
		}

		if (rules.length === 0) {
			result.errors.push('At least one conversion rule is required');
			result.valid = false;
			return result;
		}

		// Validate each rule
		rules.forEach((rule, index) => {
			const ruleValidation = this.validateConversionRule(rule, index);
			result.errors.push(...ruleValidation.errors);
			result.warnings.push(...ruleValidation.warnings);
		});

		// Check for duplicate names
		const names = rules.map(rule => rule.name?.trim().toLowerCase()).filter(name => name);
		const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
		if (duplicateNames.length > 0) {
			result.errors.push(`Duplicate conversion names found: ${[...new Set(duplicateNames)].join(', ')}`);
		}

		// Check for overlapping register usage
		const registerUsage = this.checkRegisterOverlaps(rules);
		if (registerUsage.overlaps.length > 0) {
			result.warnings.push(`Register overlaps detected: ${registerUsage.overlaps.join(', ')}`);
		}

		result.valid = result.errors.length === 0;
		return result;
	}

	/**
	 * Check for register overlaps between conversion rules
	 */
	private static checkRegisterOverlaps(rules: ConversionRule[]): { overlaps: string[] } {
		const overlaps: string[] = [];
		const registerRanges: { name: string; start: number; end: number }[] = [];

		// Build register ranges for each rule
		rules.forEach(rule => {
			if (rule.startRegister !== undefined && rule.dataType) {
				const registersNeeded = this.getRegistersNeeded(rule.dataType);
				registerRanges.push({
					name: rule.name,
					start: rule.startRegister,
					end: rule.startRegister + registersNeeded - 1,
				});
			}
		});

		// Check for overlaps
		for (let i = 0; i < registerRanges.length; i++) {
			for (let j = i + 1; j < registerRanges.length; j++) {
				const range1 = registerRanges[i];
				const range2 = registerRanges[j];

				if (this.rangesOverlap(range1, range2)) {
					overlaps.push(`${range1.name} and ${range2.name}`);
				}
			}
		}

		return { overlaps };
	}

	/**
	 * Get number of registers needed for a data type
	 */
	private static getRegistersNeeded(dataType: string): number {
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
	 * Check if two register ranges overlap
	 */
	private static rangesOverlap(range1: { start: number; end: number }, range2: { start: number; end: number }): boolean {
		return range1.start <= range2.end && range2.start <= range1.end;
	}

	/**
	 * Validate input data structure
	 */
	static validateInputData(data: any, inputSource: string, customPath?: string): ValidationResult {
		const result: ValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
		};

		if (!data) {
			result.errors.push('Input data is required');
			result.valid = false;
			return result;
		}

		let registers: number[] = [];

		try {
			switch (inputSource) {
				case 'data':
					if (Array.isArray(data)) {
						registers = data;
					} else if (typeof data === 'object' && data.data) {
						registers = Array.isArray(data.data) ? data.data : [data.data];
					} else {
						result.errors.push('Expected array or object with data property');
					}
					break;
				case 'values':
					if (Array.isArray(data)) {
						registers = data;
					} else {
						result.errors.push('Expected array of values');
					}
					break;
				case 'registers':
					if (Array.isArray(data)) {
						registers = data;
					} else if (typeof data === 'object' && data.registers) {
						registers = Array.isArray(data.registers) ? data.registers : [data.registers];
					} else {
						result.errors.push('Expected array or object with registers property');
					}
					break;
				case 'custom_path':
					if (!customPath) {
						result.errors.push('Custom path is required when using custom_path input source');
					} else {
						const pathValue = this.getValueByPath(data, customPath);
						if (Array.isArray(pathValue)) {
							registers = pathValue;
						} else if (typeof pathValue === 'number') {
							registers = [pathValue];
						} else {
							result.errors.push(`Custom path '${customPath}' does not contain valid register data`);
						}
					}
					break;
				default:
					result.errors.push(`Unsupported input source: ${inputSource}`);
			}

			// Validate that we have numeric data
			if (registers.length > 0) {
				const nonNumeric = registers.filter(reg => typeof reg !== 'number');
				if (nonNumeric.length > 0) {
					result.errors.push(`Non-numeric values found in register data: ${nonNumeric.slice(0, 5).join(', ')}${nonNumeric.length > 5 ? '...' : ''}`);
				}
			}

			if (registers.length === 0 && result.errors.length === 0) {
				result.warnings.push('No register data found');
			}

		} catch (error) {
			result.errors.push(`Error processing input data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		result.valid = result.errors.length === 0;
		return result;
	}

	/**
	 * Get value from object by dot notation path
	 */
	private static getValueByPath(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => {
			return current && current[key] !== undefined ? current[key] : undefined;
		}, obj);
	}

	/**
	 * Validate node parameters
	 */
	static validateNodeParameters(parameters: any): ValidationResult {
		const result: ValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
		};

		// Validate required parameters
		if (!parameters.conversions) {
			result.errors.push('Conversions parameter is required');
		}

		if (!parameters.inputSource) {
			result.errors.push('Input source is required');
		}

		if (!parameters.outputFormat) {
			result.errors.push('Output format is required');
		}

		if (!parameters.errorHandling) {
			result.errors.push('Error handling is required');
		}

		// Validate enum values
		const validInputSources = ['data', 'values', 'registers', 'custom_path'];
		if (parameters.inputSource && !validInputSources.includes(parameters.inputSource)) {
			result.errors.push(`Invalid input source. Must be one of: ${validInputSources.join(', ')}`);
		}

		const validOutputFormats = ['individual_fields', 'conversion_object', 'both'];
		if (parameters.outputFormat && !validOutputFormats.includes(parameters.outputFormat)) {
			result.errors.push(`Invalid output format. Must be one of: ${validOutputFormats.join(', ')}`);
		}

		const validErrorHandling = ['stop_on_error', 'skip_invalid', 'default_values'];
		if (parameters.errorHandling && !validErrorHandling.includes(parameters.errorHandling)) {
			result.errors.push(`Invalid error handling. Must be one of: ${validErrorHandling.join(', ')}`);
		}

		// Validate custom path requirement
		if (parameters.inputSource === 'custom_path' && !parameters.customPath) {
			result.errors.push('Custom path is required when input source is custom_path');
		}

		result.valid = result.errors.length === 0;
		return result;
	}

	/**
	 * Create detailed error message from validation result
	 */
	static createErrorMessage(validationResult: ValidationResult, context: string): string {
		let message = `${context} validation failed:\n`;
		
		if (validationResult.errors.length > 0) {
			message += '\nErrors:\n';
			validationResult.errors.forEach(error => {
				message += `- ${error}\n`;
			});
		}

		if (validationResult.warnings.length > 0) {
			message += '\nWarnings:\n';
			validationResult.warnings.forEach(warning => {
				message += `- ${warning}\n`;
			});
		}

		return message;
	}
}