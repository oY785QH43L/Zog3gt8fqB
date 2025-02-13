import 'reflect-metadata';
import { injectable } from 'inversify';

@injectable()
/**
 * The logger service.
 */
export class LoggerService {
    /**
     * Logs the input message.
     * @param message The input message.
     * @param prefix The prefix of the message.
     */
    public logInfo(message: string, prefix: string): void {
        let date = new Date();
        let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let timeString = date.toLocaleTimeString();
        let prefixToInsert = prefix == null || prefix.length == 0 ? "" : "[" + prefix + "]";
        console.info('\x1b[33m%s\x1b[0m', `[${dateString} ${timeString}] ${prefixToInsert} ${message}`);
    }

    /**
     * Logs the input error message.
     * @param error The input error message.
     * @param prefix The prefix of the message.
     */
    public logError(error: string, prefix: string): void {
        let date = new Date();
        let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let timeString = date.toLocaleTimeString();
        let prefixToInsert = prefix == null || prefix.length == 0 ? "" : "[" + prefix + "]";
        console.info('\x1b[31m%s\x1b[0m', `[${dateString} ${timeString}] ${prefixToInsert} ${error}`);
    }
}