import { injectable } from 'inversify';
import 'reflect-metadata';

@injectable()
/**
 * The hashing service.
 */
export class HashingService {

    /**
     * Hashes the password.
     * @param passWord The password to hash.
     * @returns The hashed password.
     */
    public hash(passWord: string): string {
        let bcrypt = require('bcryptjs');
        return bcrypt.hashSync(passWord, 10);
    }

    /**
     * Returns a boolean indicating whether the plain text matches the hash.
     * @param plainTextPassword The plain text password.
     * @param hashedPassword The input hash.
     * @returns Boolean indicating whether the plain text matches the hash.
     */
    public isValid(plainTextPassword: string, hashedPassword: string): boolean {
        let bcrypt = require('bcryptjs');
        return bcrypt.compareSync(plainTextPassword, hashedPassword);
    }
}