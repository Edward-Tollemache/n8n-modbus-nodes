export interface ConversionPreset {
	id: string;
	name: string;
	description: string;
	icon?: string;
	conversions: PresetConversion[];
}

import { ConversionRule } from './DataConversionUtils';

export interface PresetConversion extends Omit<ConversionRule, 'byteOrder'> {
	byteOrder?: string;
}

export class ConversionPresets {
	static readonly PRESETS: ConversionPreset[] = [
		{
			id: 'temperature_sensor',
			name: 'Temperature Sensor',
			description: 'Common temperature sensor with float32 output',
			conversions: [{
				name: 'temperature',
				dataType: 'float32',
				startRegister: 0,
				byteOrder: 'BE',
				unitConversion: {
					from: 'celsius',
					to: 'fahrenheit',
				},
				validation: {
					enabled: true,
					min: -50,
					max: 150,
				},
			}],
		},
		{
			id: 'pressure_transmitter',
			name: 'Pressure Transmitter',
			description: '4-20mA pressure transmitter with scaled output',
			conversions: [{
				name: 'pressure',
				dataType: 'scaled',
				startRegister: 0,
				scaleFactor: 0.01,
				offset: 0,
				validation: {
					enabled: true,
					min: 0,
					max: 1000,
				},
			}],
		},
		{
			id: 'power_meter',
			name: 'Power Meter',
			description: 'Three-phase power meter with multiple measurements',
			conversions: [
				{
					name: 'voltage_l1',
					dataType: 'float32',
					startRegister: 0,
					byteOrder: 'BE',
				},
				{
					name: 'voltage_l2',
					dataType: 'float32',
					startRegister: 2,
					byteOrder: 'BE',
				},
				{
					name: 'voltage_l3',
					dataType: 'float32',
					startRegister: 4,
					byteOrder: 'BE',
				},
				{
					name: 'current_l1',
					dataType: 'float32',
					startRegister: 6,
					byteOrder: 'BE',
				},
				{
					name: 'current_l2',
					dataType: 'float32',
					startRegister: 8,
					byteOrder: 'BE',
				},
				{
					name: 'current_l3',
					dataType: 'float32',
					startRegister: 10,
					byteOrder: 'BE',
				},
				{
					name: 'power_total',
					dataType: 'float32',
					startRegister: 12,
					byteOrder: 'BE',
					unitConversion: {
						from: 'watt',
						to: 'kilowatt',
					},
				},
			],
		},
		{
			id: 'flow_meter',
			name: 'Flow Meter',
			description: 'Flow meter with rate and totalization',
			conversions: [
				{
					name: 'flow_rate',
					dataType: 'float32',
					startRegister: 0,
					byteOrder: 'BE',
					unitConversion: {
						from: 'lpm',
						to: 'gpm',
					},
				},
				{
					name: 'total_volume',
					dataType: 'uint32',
					startRegister: 2,
					byteOrder: 'BE',
				},
			],
		},
		{
			id: 'plc_status',
			name: 'PLC Status Registers',
			description: 'Common PLC status and control registers',
			conversions: [
				{
					name: 'status_word',
					dataType: 'bitfield',
					startRegister: 0,
				},
				{
					name: 'alarm_word',
					dataType: 'bitfield',
					startRegister: 1,
				},
				{
					name: 'setpoint',
					dataType: 'int16',
					startRegister: 2,
				},
				{
					name: 'actual_value',
					dataType: 'int16',
					startRegister: 3,
				},
			],
		},
		{
			id: 'vfd_drive',
			name: 'VFD Drive',
			description: 'Variable Frequency Drive parameters',
			conversions: [
				{
					name: 'frequency',
					dataType: 'scaled',
					startRegister: 0,
					scaleFactor: 0.1,
					validation: {
						enabled: true,
						min: 0,
						max: 60,
					},
				},
				{
					name: 'motor_current',
					dataType: 'scaled',
					startRegister: 1,
					scaleFactor: 0.1,
				},
				{
					name: 'motor_voltage',
					dataType: 'int16',
					startRegister: 2,
				},
				{
					name: 'drive_status',
					dataType: 'bitfield',
					startRegister: 3,
				},
			],
		},
		{
			id: 'tank_level',
			name: 'Tank Level Sensor',
			description: 'Tank level measurement with scaling',
			conversions: [{
				name: 'level',
				dataType: 'scaled',
				startRegister: 0,
				scaleFactor: 0.1,
				offset: 0,
				validation: {
					enabled: true,
					min: 0,
					max: 100,
				},
			}],
		},
		{
			id: 'energy_meter',
			name: 'Energy Meter',
			description: 'Energy consumption meter',
			conversions: [
				{
					name: 'active_energy',
					dataType: 'uint32',
					startRegister: 0,
					byteOrder: 'BE',
				},
				{
					name: 'reactive_energy',
					dataType: 'uint32',
					startRegister: 2,
					byteOrder: 'BE',
				},
				{
					name: 'power_factor',
					dataType: 'scaled',
					startRegister: 4,
					scaleFactor: 0.001,
					validation: {
						enabled: true,
						min: -1,
						max: 1,
					},
				},
			],
		},
	];

	static getPresetById(id: string): ConversionPreset | undefined {
		return this.PRESETS.find(preset => preset.id === id);
	}

	static getPresetsByCategory(category: string): ConversionPreset[] {
		// Could be extended to support categories
		return this.PRESETS;
	}

	/**
	 * Apply a preset to the conversion rules
	 */
	static applyPreset(presetId: string, startOffset: number = 0): ConversionRule[] {
		const preset = this.getPresetById(presetId);
		if (!preset) return [];

		// Apply register offset to all conversions and convert to ConversionRule format
		return preset.conversions.map(conv => ({
			...conv,
			startRegister: conv.startRegister + startOffset,
			byteOrder: conv.byteOrder === 'BE' ? 'big_endian' : 'little_endian' as 'big_endian' | 'little_endian',
		})) as ConversionRule[];
	}
}