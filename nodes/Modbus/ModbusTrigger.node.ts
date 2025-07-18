import type {
	ITriggerFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	IRun,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createClient, type ModbusCredential } from './GenericFunctions';
import { TCPStream } from 'modbus-stream';

interface Options {
	jsonParseBody: boolean;
	parallelProcessing: boolean;
}

export class ModbusTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MODBUS Trigger',
		name: 'modbusTrigger',
		icon: 'file:modbus.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listens to MODBUS TCP events',
		eventTriggerDescription: '',
		defaults: {
			name: 'MODBUS Trigger',
		},
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger an MODBUS event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, <a data-key='activate'>activate</a> it. Then every time a change is detected, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
				active:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger an MODBUS event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a change is detected, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
			},
			activationHint:
				"Once you’ve finished building your workflow, <a data-key='activate'>activate</a> it to have it also listen continuously (you just won’t see those executions here).",
		},
		inputs: [],
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
				displayName: 'Function Code',
				name: 'functionCode',
				type: 'options',
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
				description: 'The memory address to read from',
			},
			{
				displayName: 'Quantity',
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
				displayName: 'Polling',
				name: 'polling',
				type: 'number',
				default: 1000,
				description: 'The polling interval in milliseconds',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		let poller: NodeJS.Timeout;
		let client: TCPStream;

		try {
			const credentials = await this.getCredentials<ModbusCredential>('modbusApi');
			const functionCode = this.getNodeParameter('functionCode') as string;
			const memoryAddress = this.getNodeParameter('memoryAddress') as number;
			const quantity = this.getNodeParameter('quantity') as number;
			const polling = this.getNodeParameter('polling') as number;
			const options = this.getNodeParameter('options') as Options;

			// Parse the memory address as an integer
			if (isNaN(memoryAddress)) {
				throw new NodeOperationError(this.getNode(), 'Memory address must be a valid number.');
			}

			// Connect to the MODBUS TCP device
			client = await createClient(credentials);


			const compareData = (data1?: any[], data2?: any[]) => {
				if (!data1 || !data2 || data1.length !== data2.length) return false;
				return data1.every((val, i) => val === data2[i]);
			};

			const readModbusData = (callback: (err: any, data: any) => void) => {
				switch (functionCode) {
					case 'FC1':
						client.readCoils({ address: memoryAddress, quantity }, callback);
						break;
					case 'FC2':
						client.readDiscreteInputs({ address: memoryAddress, quantity }, callback);
						break;
					case 'FC3':
						client.readHoldingRegisters({ address: memoryAddress, quantity }, callback);
						break;
					case 'FC4':
						client.readInputRegisters({ address: memoryAddress, quantity }, callback);
						break;
					default:
						callback(new Error('Invalid function code: ' + functionCode), null);
				}
			};

			const processData = (data: any) => {
				if (functionCode === 'FC1' || functionCode === 'FC2') {
					// For coils and discrete inputs, return boolean array
					return data?.response.data || [];
				} else {
					// For holding and input registers, convert to integers
					return data?.response.data?.map((value: Buffer) => value.readInt16BE(0)) || [];
				}
			};

			if (this.getMode() === 'trigger') {
				const donePromise = !options.parallelProcessing
					? this.helpers.createDeferredPromise<IRun>()
					: undefined;

				let previousData: any[] | undefined;

				// Start polling for changes
				poller = setInterval(() => {
					readModbusData((err, data) => {
						if (err) {
							clearInterval(poller);
							throw new NodeOperationError(this.getNode(), `MODBUS ${functionCode} Error: ` + err.message);
						}

						const currentData = processData(data);

						if (!compareData(previousData, currentData)) {
							previousData = currentData;
							const returnData: IDataObject = {
								functionCode: functionCode,
								address: memoryAddress,
								quantity: quantity,
								data: currentData,
							};

							this.emit([this.helpers.returnJsonArray([returnData])]);
							if (donePromise) {
								donePromise.promise;
							}
						}
					});
				}, polling);
			}

			const manualTriggerFunction = async () => {
				return new Promise<void>((resolve, reject) => {
					let cycle = 0;
					let previousData: any[] | undefined;

					poller = setInterval(() => {
						readModbusData((err, data) => {
							if (err) {
								clearInterval(poller);
								reject(new NodeOperationError(this.getNode(), `MODBUS ${functionCode} Error: ` + err.message));
								return;
							}

							const currentData = processData(data);

							if (!compareData(previousData, currentData) || cycle === 0) {
								previousData = currentData;
								if (cycle > 0) {
									const returnData: IDataObject = {
										functionCode: functionCode,
										address: memoryAddress,
										quantity: quantity,
										data: currentData,
									};
									this.emit([this.helpers.returnJsonArray([returnData])]);
									clearInterval(poller);
									resolve();
								}
								cycle++;
							}
						});
					}, polling);
				});
			};

			const closeFunction = async () => {
				clearInterval(poller);
			};

			return {
				closeFunction,
				manualTriggerFunction,
			};
		} catch (error) {
			throw error;
		}
	}
}
