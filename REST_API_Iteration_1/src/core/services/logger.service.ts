import { injectable } from 'inversify';
import 'reflect-metadata';

/**
 * The logger service.
 */
@injectable()
export class LoggerService {
    /**
     * Logs the input message.
     * @param message The input message.
     */
    public logInfo(message: string): void{
        let date = new Date();
        let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let timeString = date.toLocaleTimeString();
        console.info('\x1b[33m%s\x1b[0m', `[${dateString} ${timeString}] ${message}`);
    }

    /**
     * Logs the input error message.
     * @param error The input error message.
     */
    public logError(error: string): void{
        let date = new Date();
        let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let timeString = date.toLocaleTimeString();
        console.info('\x1b[31m%s\x1b[0m', `[${dateString} ${timeString}] ${error}`);
    }
}