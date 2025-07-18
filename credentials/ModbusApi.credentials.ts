import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ModbusApi implements ICredentialType {
	name = 'modbusApi';

	displayName = 'MODBUS API';

	documentationUrl = 'https://github.com/lostedz/n8n-nodes-modbus';

	properties: INodeProperties[] = [
		{
			displayName: 'Protocol',
			name: 'protocol',
			type: 'options',
			options: [
				{
					name: 'modbus',
					value: 'tcp',
				},
			],
			default: 'modbus',
		},
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 502,
		},
		{
			displayName: 'Unit ID',
			name: 'unitId',
			type: 'number',
			default: 1,
			description: 'The Modbus unit/slave ID for the device (0-255)',
			typeOptions: {
				maxValue: 255,
				minValue: 0,
			},
		},
	];
}
