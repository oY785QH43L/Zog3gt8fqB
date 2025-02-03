import { injectable } from 'inversify';
import 'reflect-metadata';

/**
 * The hashing service.
 */
@injectable()
export class HashingService {

  public hash(passWord: string): string {
    let bcrypt = require('bcrypt');
    return bcrypt.hashSync(passWord,10);
  }

  public isValid(plainTextPassword: string, hashedPassword: string): boolean {
    let bcrypt = require('bcrypt');
    return bcrypt.compareSync(plainTextPassword, hashedPassword);
  }
}