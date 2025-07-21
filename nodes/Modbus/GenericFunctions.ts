import modbus from 'modbus-stream';
import { ApplicationError } from 'n8n-workflow';

interface BaseModbusCredential {
	host: string;
	port: number;
	timeout: number;
	unitId: number;
}

export type ModbusCredential = BaseModbusCredential;

export const createClient = async (credentials: ModbusCredential): Promise<modbus.TCPStream> => {
	const { host, port, timeout = 5000, unitId = 1 } = credentials;

	return new Promise((resolve, reject) => {
		modbus.tcp.connect(port, host, { debug: null, connectTimeout: timeout, unitId }, (err, client) => {
			if (err) {
				reject(new ApplicationError(err.message));
				return;
			}

			resolve(client);
		});
	});
};
