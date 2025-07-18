import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createClient, type ModbusCredential } from './GenericFunctions';

export class Modbus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MODBUS',
		name: 'modbus',
		icon: 'file:modbus.svg',
		group: ['input'],
		version: 1,
		description: 'Read and write to MODBUS devices',
		eventTriggerDescription: '',
		defaults: {
			name: 'MODBUS',
		},
		usableAsTool: true,
		//@ts-ignore
		inputs: ['main'],
		//@ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'modbusApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Read',
						value: 'read',
					},
					{
						name: 'Write',
						value: 'write',
					},
				],
				default: 'read',
				noDataExpression: true,
			},
			{
				displayName: 'Function Code',
				name: 'functionCode',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['read'],
					},
				},
				options: [
					{
						name: 'FC1 - Read Coils',
						value: 'FC1',
						description: 'Read discrete output coils (1-bit values)',
					},
					{
						name: 'FC2 - Read Discrete Inputs',
						value: 'FC2',
						description: 'Read discrete input contacts (1-bit values)',
					},
					{
						name: 'FC3 - Read Holding Registers',
						value: 'FC3',
						description: 'Read holding registers (16-bit values)',
					},
					{
						name: 'FC4 - Read Input Registers',
						value: 'FC4',
						description: 'Read input registers (16-bit values)',
					},
				],
				default: 'FC3',
				noDataExpression: true,
			},
			{
				displayName: 'Memory Address',
				name: 'memoryAddress',
				type: 'number',
				default: 1,
				description: 'The memory address to read from or write to',
			},
			{
				displayName: 'Quantity',
				displayOptions: {
					show: {
						operation: ['read'],
					},
				},
				name: 'quantity',
				type: 'number',
				default: 1,
				description: 'The number of coils/inputs/registers to read',
				typeOptions: {
					maxValue: 2000,
					minValue: 1,
				},
			},
			{
				displayName: 'Value',
				displayOptions: {
					show: {
						operation: ['write'],
					},
				},
				name: 'value',
				type: 'number',
				typeOptions: {
					maxValue: 32767,
					minValue: -32768,
				},
				default: 1,
				description: 'The value to write to the holding register',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let responseData: IDataObject = {};
		const credentials = await this.getCredentials<ModbusCredential>('modbusApi');
		const client = await createClient(credentials);

		const memoryAddress = this.getNodeParameter('memoryAddress', 0) as number;
		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'read') {
			const functionCode = this.getNodeParameter('functionCode', 0) as string;
			const quantity = this.getNodeParameter('quantity', 0) as number;

			await new Promise((resolve) => {
				switch (functionCode) {
					case 'FC1':
						client.readCoils({ address: memoryAddress, quantity }, (err, data) => {
							if (err) {
								throw new NodeOperationError(this.getNode(), 'MODBUS FC1 Error: ' + err.message);
							}

							const returnData: IDataObject = {
								functionCode: 'FC1',
								address: memoryAddress,
								quantity: quantity,
								data: data?.response.data || [],
							};

							responseData = returnData;
							resolve(responseData);
						});
						break;

					case 'FC2':
						client.readDiscreteInputs({ address: memoryAddress, quantity }, (err, data) => {
							if (err) {
								throw new NodeOperationError(this.getNode(), 'MODBUS FC2 Error: ' + err.message);
							}

							const returnData: IDataObject = {
								functionCode: 'FC2',
								address: memoryAddress,
								quantity: quantity,
								data: data?.response.data || [],
							};

							responseData = returnData;
							resolve(responseData);
						});
						break;

					case 'FC3':
						client.readHoldingRegisters({ address: memoryAddress, quantity }, (err, data) => {
							if (err) {
								throw new NodeOperationError(this.getNode(), 'MODBUS FC3 Error: ' + err.message);
							}

							const returnData: IDataObject = {
								functionCode: 'FC3',
								address: memoryAddress,
								quantity: quantity,
								data: data?.response.data?.map((value) => value.readInt16BE(0)),
							};

							responseData = returnData;
							resolve(responseData);
						});
						break;

					case 'FC4':
						client.readInputRegisters({ address: memoryAddress, quantity }, (err, data) => {
							if (err) {
								throw new NodeOperationError(this.getNode(), 'MODBUS FC4 Error: ' + err.message);
							}

							const returnData: IDataObject = {
								functionCode: 'FC4',
								address: memoryAddress,
								quantity: quantity,
								data: data?.response.data?.map((value) => value.readInt16BE(0)),
							};

							responseData = returnData;
							resolve(responseData);
						});
						break;

					default:
						throw new NodeOperationError(this.getNode(), 'Invalid function code: ' + functionCode);
				}
			});
		}

		if (operation === 'write') {
			const value = this.getNodeParameter('value', 0) as number;

			const buffer = Buffer.alloc(2);
			buffer.writeInt16BE(value);

			await new Promise((resolve) => {
				client.writeSingleRegister({ address: memoryAddress, value: buffer }, (err, data) => {
					if (err) {
						throw new NodeOperationError(this.getNode(), 'MODBUS Write Error: ' + err.message);
					}

					const returnData: IDataObject = {
						functionCode: 'FC6',
						address: memoryAddress,
						value: value,
						data: data.response,
					};

					responseData = returnData;
					resolve(responseData);
				});
			});
		}

		return [this.helpers.returnJsonArray(responseData)];
	}
}
