export interface UnitDefinition {
	name: string;
	symbol: string;
	category: string;
	description: string;
}

export interface UnitConversionFunction {
	from: string;
	to: string;
	convert: (value: number) => number;
	formula: string;
}

export class IndustrialUnits {
	/**
	 * Available industrial units organized by category
	 */
	static readonly UNITS: { [category: string]: UnitDefinition[] } = {
		temperature: [
			{ name: 'celsius', symbol: '°C', category: 'temperature', description: 'Degrees Celsius' },
			{ name: 'fahrenheit', symbol: '°F', category: 'temperature', description: 'Degrees Fahrenheit' },
			{ name: 'kelvin', symbol: 'K', category: 'temperature', description: 'Kelvin' },
			{ name: 'rankine', symbol: '°R', category: 'temperature', description: 'Degrees Rankine' },
		],
		pressure: [
			{ name: 'pascal', symbol: 'Pa', category: 'pressure', description: 'Pascal' },
			{ name: 'bar', symbol: 'bar', category: 'pressure', description: 'Bar' },
			{ name: 'psi', symbol: 'psi', category: 'pressure', description: 'Pounds per Square Inch' },
			{ name: 'atm', symbol: 'atm', category: 'pressure', description: 'Atmosphere' },
			{ name: 'mmhg', symbol: 'mmHg', category: 'pressure', description: 'Millimeters of Mercury' },
			{ name: 'inhg', symbol: 'inHg', category: 'pressure', description: 'Inches of Mercury' },
			{ name: 'torr', symbol: 'Torr', category: 'pressure', description: 'Torr' },
		],
		flow: [
			{ name: 'lpm', symbol: 'L/min', category: 'flow', description: 'Liters per Minute' },
			{ name: 'gpm', symbol: 'gal/min', category: 'flow', description: 'Gallons per Minute' },
			{ name: 'cfm', symbol: 'ft³/min', category: 'flow', description: 'Cubic Feet per Minute' },
			{ name: 'cmh', symbol: 'm³/h', category: 'flow', description: 'Cubic Meters per Hour' },
			{ name: 'lps', symbol: 'L/s', category: 'flow', description: 'Liters per Second' },
			{ name: 'cms', symbol: 'm³/s', category: 'flow', description: 'Cubic Meters per Second' },
		],
		power: [
			{ name: 'watt', symbol: 'W', category: 'power', description: 'Watt' },
			{ name: 'kilowatt', symbol: 'kW', category: 'power', description: 'Kilowatt' },
			{ name: 'horsepower', symbol: 'hp', category: 'power', description: 'Horsepower' },
			{ name: 'btu_h', symbol: 'BTU/h', category: 'power', description: 'British Thermal Units per Hour' },
			{ name: 'ton_refrigeration', symbol: 'TR', category: 'power', description: 'Ton of Refrigeration' },
		],
		energy: [
			{ name: 'joule', symbol: 'J', category: 'energy', description: 'Joule' },
			{ name: 'kilowatt_hour', symbol: 'kWh', category: 'energy', description: 'Kilowatt Hour' },
			{ name: 'btu', symbol: 'BTU', category: 'energy', description: 'British Thermal Unit' },
			{ name: 'calorie', symbol: 'cal', category: 'energy', description: 'Calorie' },
			{ name: 'therm', symbol: 'thm', category: 'energy', description: 'Therm' },
		],
		speed: [
			{ name: 'mps', symbol: 'm/s', category: 'speed', description: 'Meters per Second' },
			{ name: 'fps', symbol: 'ft/s', category: 'speed', description: 'Feet per Second' },
			{ name: 'mph', symbol: 'mph', category: 'speed', description: 'Miles per Hour' },
			{ name: 'kmh', symbol: 'km/h', category: 'speed', description: 'Kilometers per Hour' },
			{ name: 'knot', symbol: 'kn', category: 'speed', description: 'Knot' },
		],
		volume: [
			{ name: 'liter', symbol: 'L', category: 'volume', description: 'Liter' },
			{ name: 'gallon', symbol: 'gal', category: 'volume', description: 'Gallon (US)' },
			{ name: 'cubic_meter', symbol: 'm³', category: 'volume', description: 'Cubic Meter' },
			{ name: 'cubic_foot', symbol: 'ft³', category: 'volume', description: 'Cubic Foot' },
			{ name: 'barrel', symbol: 'bbl', category: 'volume', description: 'Barrel (Oil)' },
		],
		length: [
			{ name: 'meter', symbol: 'm', category: 'length', description: 'Meter' },
			{ name: 'foot', symbol: 'ft', category: 'length', description: 'Foot' },
			{ name: 'inch', symbol: 'in', category: 'length', description: 'Inch' },
			{ name: 'millimeter', symbol: 'mm', category: 'length', description: 'Millimeter' },
			{ name: 'centimeter', symbol: 'cm', category: 'length', description: 'Centimeter' },
		],
		mass: [
			{ name: 'kilogram', symbol: 'kg', category: 'mass', description: 'Kilogram' },
			{ name: 'pound', symbol: 'lb', category: 'mass', description: 'Pound' },
			{ name: 'gram', symbol: 'g', category: 'mass', description: 'Gram' },
			{ name: 'ounce', symbol: 'oz', category: 'mass', description: 'Ounce' },
			{ name: 'ton', symbol: 't', category: 'mass', description: 'Metric Ton' },
		],
		electrical: [
			{ name: 'volt', symbol: 'V', category: 'electrical', description: 'Volt' },
			{ name: 'ampere', symbol: 'A', category: 'electrical', description: 'Ampere' },
			{ name: 'ohm', symbol: 'Ω', category: 'electrical', description: 'Ohm' },
			{ name: 'watt_electrical', symbol: 'W', category: 'electrical', description: 'Watt (Electrical)' },
			{ name: 'kilowatt_electrical', symbol: 'kW', category: 'electrical', description: 'Kilowatt (Electrical)' },
		],
	};

	/**
	 * Unit conversion functions
	 */
	static readonly CONVERSIONS: UnitConversionFunction[] = [
		// Temperature conversions
		{
			from: 'celsius',
			to: 'fahrenheit',
			convert: (val: number) => (val * 9 / 5) + 32,
			formula: '(°C × 9/5) + 32',
		},
		{
			from: 'fahrenheit',
			to: 'celsius',
			convert: (val: number) => (val - 32) * 5 / 9,
			formula: '(°F - 32) × 5/9',
		},
		{
			from: 'celsius',
			to: 'kelvin',
			convert: (val: number) => val + 273.15,
			formula: '°C + 273.15',
		},
		{
			from: 'kelvin',
			to: 'celsius',
			convert: (val: number) => val - 273.15,
			formula: 'K - 273.15',
		},
		{
			from: 'fahrenheit',
			to: 'kelvin',
			convert: (val: number) => (val - 32) * 5 / 9 + 273.15,
			formula: '(°F - 32) × 5/9 + 273.15',
		},
		{
			from: 'kelvin',
			to: 'fahrenheit',
			convert: (val: number) => (val - 273.15) * 9 / 5 + 32,
			formula: '(K - 273.15) × 9/5 + 32',
		},
		{
			from: 'celsius',
			to: 'rankine',
			convert: (val: number) => (val + 273.15) * 9 / 5,
			formula: '(°C + 273.15) × 9/5',
		},
		{
			from: 'rankine',
			to: 'celsius',
			convert: (val: number) => val * 5 / 9 - 273.15,
			formula: '°R × 5/9 - 273.15',
		},

		// Pressure conversions
		{
			from: 'pascal',
			to: 'bar',
			convert: (val: number) => val * 1e-5,
			formula: 'Pa × 1e-5',
		},
		{
			from: 'bar',
			to: 'pascal',
			convert: (val: number) => val * 1e5,
			formula: 'bar × 1e5',
		},
		{
			from: 'psi',
			to: 'bar',
			convert: (val: number) => val * 0.0689476,
			formula: 'psi × 0.0689476',
		},
		{
			from: 'bar',
			to: 'psi',
			convert: (val: number) => val * 14.5038,
			formula: 'bar × 14.5038',
		},
		{
			from: 'pascal',
			to: 'psi',
			convert: (val: number) => val * 0.000145038,
			formula: 'Pa × 0.000145038',
		},
		{
			from: 'psi',
			to: 'pascal',
			convert: (val: number) => val * 6894.76,
			formula: 'psi × 6894.76',
		},
		{
			from: 'bar',
			to: 'atm',
			convert: (val: number) => val * 0.986923,
			formula: 'bar × 0.986923',
		},
		{
			from: 'atm',
			to: 'bar',
			convert: (val: number) => val * 1.01325,
			formula: 'atm × 1.01325',
		},
		{
			from: 'mmhg',
			to: 'pascal',
			convert: (val: number) => val * 133.322,
			formula: 'mmHg × 133.322',
		},
		{
			from: 'pascal',
			to: 'mmhg',
			convert: (val: number) => val * 0.00750062,
			formula: 'Pa × 0.00750062',
		},

		// Flow conversions
		{
			from: 'gpm',
			to: 'lpm',
			convert: (val: number) => val * 3.78541,
			formula: 'gpm × 3.78541',
		},
		{
			from: 'lpm',
			to: 'gpm',
			convert: (val: number) => val * 0.264172,
			formula: 'L/min × 0.264172',
		},
		{
			from: 'cfm',
			to: 'cmh',
			convert: (val: number) => val * 1.69901,
			formula: 'ft³/min × 1.69901',
		},
		{
			from: 'cmh',
			to: 'cfm',
			convert: (val: number) => val * 0.588578,
			formula: 'm³/h × 0.588578',
		},
		{
			from: 'lpm',
			to: 'lps',
			convert: (val: number) => val / 60,
			formula: 'L/min ÷ 60',
		},
		{
			from: 'lps',
			to: 'lpm',
			convert: (val: number) => val * 60,
			formula: 'L/s × 60',
		},
		{
			from: 'cmh',
			to: 'cms',
			convert: (val: number) => val / 3600,
			formula: 'm³/h ÷ 3600',
		},
		{
			from: 'cms',
			to: 'cmh',
			convert: (val: number) => val * 3600,
			formula: 'm³/s × 3600',
		},

		// Power conversions
		{
			from: 'watt',
			to: 'kilowatt',
			convert: (val: number) => val / 1000,
			formula: 'W ÷ 1000',
		},
		{
			from: 'kilowatt',
			to: 'watt',
			convert: (val: number) => val * 1000,
			formula: 'kW × 1000',
		},
		{
			from: 'horsepower',
			to: 'kilowatt',
			convert: (val: number) => val * 0.745699,
			formula: 'hp × 0.745699',
		},
		{
			from: 'kilowatt',
			to: 'horsepower',
			convert: (val: number) => val * 1.34102,
			formula: 'kW × 1.34102',
		},
		{
			from: 'btu_h',
			to: 'kilowatt',
			convert: (val: number) => val * 0.000293071,
			formula: 'BTU/h × 0.000293071',
		},
		{
			from: 'kilowatt',
			to: 'btu_h',
			convert: (val: number) => val * 3412.14,
			formula: 'kW × 3412.14',
		},
		{
			from: 'ton_refrigeration',
			to: 'kilowatt',
			convert: (val: number) => val * 3.51685,
			formula: 'TR × 3.51685',
		},
		{
			from: 'kilowatt',
			to: 'ton_refrigeration',
			convert: (val: number) => val * 0.284345,
			formula: 'kW × 0.284345',
		},

		// Energy conversions
		{
			from: 'joule',
			to: 'kilowatt_hour',
			convert: (val: number) => val / 3.6e6,
			formula: 'J ÷ 3.6e6',
		},
		{
			from: 'kilowatt_hour',
			to: 'joule',
			convert: (val: number) => val * 3.6e6,
			formula: 'kWh × 3.6e6',
		},
		{
			from: 'btu',
			to: 'joule',
			convert: (val: number) => val * 1055.06,
			formula: 'BTU × 1055.06',
		},
		{
			from: 'joule',
			to: 'btu',
			convert: (val: number) => val / 1055.06,
			formula: 'J ÷ 1055.06',
		},
		{
			from: 'calorie',
			to: 'joule',
			convert: (val: number) => val * 4.184,
			formula: 'cal × 4.184',
		},
		{
			from: 'joule',
			to: 'calorie',
			convert: (val: number) => val / 4.184,
			formula: 'J ÷ 4.184',
		},

		// Length conversions
		{
			from: 'meter',
			to: 'foot',
			convert: (val: number) => val * 3.28084,
			formula: 'm × 3.28084',
		},
		{
			from: 'foot',
			to: 'meter',
			convert: (val: number) => val * 0.3048,
			formula: 'ft × 0.3048',
		},
		{
			from: 'inch',
			to: 'meter',
			convert: (val: number) => val * 0.0254,
			formula: 'in × 0.0254',
		},
		{
			from: 'meter',
			to: 'inch',
			convert: (val: number) => val * 39.3701,
			formula: 'm × 39.3701',
		},
		{
			from: 'millimeter',
			to: 'meter',
			convert: (val: number) => val / 1000,
			formula: 'mm ÷ 1000',
		},
		{
			from: 'meter',
			to: 'millimeter',
			convert: (val: number) => val * 1000,
			formula: 'm × 1000',
		},
		{
			from: 'centimeter',
			to: 'meter',
			convert: (val: number) => val / 100,
			formula: 'cm ÷ 100',
		},
		{
			from: 'meter',
			to: 'centimeter',
			convert: (val: number) => val * 100,
			formula: 'm × 100',
		},

		// Mass conversions
		{
			from: 'kilogram',
			to: 'pound',
			convert: (val: number) => val * 2.20462,
			formula: 'kg × 2.20462',
		},
		{
			from: 'pound',
			to: 'kilogram',
			convert: (val: number) => val * 0.453592,
			formula: 'lb × 0.453592',
		},
		{
			from: 'gram',
			to: 'kilogram',
			convert: (val: number) => val / 1000,
			formula: 'g ÷ 1000',
		},
		{
			from: 'kilogram',
			to: 'gram',
			convert: (val: number) => val * 1000,
			formula: 'kg × 1000',
		},
		{
			from: 'ounce',
			to: 'kilogram',
			convert: (val: number) => val * 0.0283495,
			formula: 'oz × 0.0283495',
		},
		{
			from: 'kilogram',
			to: 'ounce',
			convert: (val: number) => val * 35.274,
			formula: 'kg × 35.274',
		},
		{
			from: 'ton',
			to: 'kilogram',
			convert: (val: number) => val * 1000,
			formula: 't × 1000',
		},
		{
			from: 'kilogram',
			to: 'ton',
			convert: (val: number) => val / 1000,
			formula: 'kg ÷ 1000',
		},

		// Volume conversions
		{
			from: 'liter',
			to: 'gallon',
			convert: (val: number) => val * 0.264172,
			formula: 'L × 0.264172',
		},
		{
			from: 'gallon',
			to: 'liter',
			convert: (val: number) => val * 3.78541,
			formula: 'gal × 3.78541',
		},
		{
			from: 'cubic_meter',
			to: 'cubic_foot',
			convert: (val: number) => val * 35.3147,
			formula: 'm³ × 35.3147',
		},
		{
			from: 'cubic_foot',
			to: 'cubic_meter',
			convert: (val: number) => val * 0.0283168,
			formula: 'ft³ × 0.0283168',
		},
		{
			from: 'barrel',
			to: 'liter',
			convert: (val: number) => val * 158.987,
			formula: 'bbl × 158.987',
		},
		{
			from: 'liter',
			to: 'barrel',
			convert: (val: number) => val / 158.987,
			formula: 'L ÷ 158.987',
		},
	];

	/**
	 * Get all available units for a category
	 */
	static getUnitsByCategory(category: string): UnitDefinition[] {
		return this.UNITS[category] || [];
	}

	/**
	 * Get all available categories
	 */
	static getCategories(): string[] {
		return Object.keys(this.UNITS);
	}

	/**
	 * Get all available units flattened
	 */
	static getAllUnits(): UnitDefinition[] {
		return Object.values(this.UNITS).flat();
	}

	/**
	 * Find unit by name
	 */
	static findUnit(name: string): UnitDefinition | undefined {
		return this.getAllUnits().find(unit => unit.name === name);
	}

	/**
	 * Convert value between units
	 */
	static convert(value: number, fromUnit: string, toUnit: string): number {
		if (fromUnit === toUnit) {
			return value;
		}

		const conversion = this.CONVERSIONS.find(
			conv => conv.from === fromUnit && conv.to === toUnit
		);

		if (conversion) {
			return conversion.convert(value);
		}

		// Try reverse conversion
		const reverseConversion = this.CONVERSIONS.find(
			conv => conv.from === toUnit && conv.to === fromUnit
		);

		if (reverseConversion) {
			// Apply inverse conversion
			return this.inverseConvert(value, reverseConversion);
		}

		throw new Error(`No conversion available from ${fromUnit} to ${toUnit}`);
	}

	/**
	 * Apply inverse conversion
	 */
	private static inverseConvert(value: number, conversion: UnitConversionFunction): number {
		// This is a simplified inverse - for more complex conversions,
		// we'd need specific inverse functions
		const testValue = 1;
		const convertedTest = conversion.convert(testValue);
		const factor = testValue / convertedTest;
		return value * factor;
	}

	/**
	 * Check if conversion is available
	 */
	static isConversionAvailable(fromUnit: string, toUnit: string): boolean {
		if (fromUnit === toUnit) {
			return true;
		}

		return this.CONVERSIONS.some(
			conv => (conv.from === fromUnit && conv.to === toUnit) ||
					(conv.from === toUnit && conv.to === fromUnit)
		);
	}

	/**
	 * Get conversion formula
	 */
	static getConversionFormula(fromUnit: string, toUnit: string): string {
		const conversion = this.CONVERSIONS.find(
			conv => conv.from === fromUnit && conv.to === toUnit
		);

		if (conversion) {
			return conversion.formula;
		}

		const reverseConversion = this.CONVERSIONS.find(
			conv => conv.from === toUnit && conv.to === fromUnit
		);

		if (reverseConversion) {
			return `Inverse of: ${reverseConversion.formula}`;
		}

		return 'No formula available';
	}

	/**
	 * Get available conversions for a unit
	 */
	static getAvailableConversions(unit: string): string[] {
		const directConversions = this.CONVERSIONS
			.filter(conv => conv.from === unit)
			.map(conv => conv.to);

		const reverseConversions = this.CONVERSIONS
			.filter(conv => conv.to === unit)
			.map(conv => conv.from);

		return [...new Set([...directConversions, ...reverseConversions])];
	}

	/**
	 * Get common industrial unit presets
	 */
	static getIndustrialPresets(): { [key: string]: { from: string; to: string; description: string } } {
		return {
			'temp_c_to_f': {
				from: 'celsius',
				to: 'fahrenheit',
				description: 'Temperature: Celsius to Fahrenheit',
			},
			'temp_f_to_c': {
				from: 'fahrenheit',
				to: 'celsius',
				description: 'Temperature: Fahrenheit to Celsius',
			},
			'pressure_psi_to_bar': {
				from: 'psi',
				to: 'bar',
				description: 'Pressure: PSI to Bar',
			},
			'pressure_bar_to_psi': {
				from: 'bar',
				to: 'psi',
				description: 'Pressure: Bar to PSI',
			},
			'flow_gpm_to_lpm': {
				from: 'gpm',
				to: 'lpm',
				description: 'Flow: GPM to LPM',
			},
			'flow_lpm_to_gpm': {
				from: 'lpm',
				to: 'gpm',
				description: 'Flow: LPM to GPM',
			},
			'power_hp_to_kw': {
				from: 'horsepower',
				to: 'kilowatt',
				description: 'Power: Horsepower to Kilowatt',
			},
			'power_kw_to_hp': {
				from: 'kilowatt',
				to: 'horsepower',
				description: 'Power: Kilowatt to Horsepower',
			},
		};
	}
}