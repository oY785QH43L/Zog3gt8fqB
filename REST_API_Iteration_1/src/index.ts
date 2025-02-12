import 'reflect-metadata';
import { IoContainer } from './core/ioc/ioc.container';
import { LoggerService } from './core/services/logger.service';
import * as express from 'express';
import { BACKEND_PORT } from '../src/config/config';
import { InversifyExpressServer } from 'inversify-express-utils';
require('dotenv').config({ path: __dirname + '/.env' });
const cors = require('cors');
const bodyParser = require('body-parser');
const container = new IoContainer();
container.init();

const logger = container.getContainer().resolve(LoggerService);
const server = new InversifyExpressServer(container.getContainer());

const app = server
    .setConfig((app) => {
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.urlencoded({ extended: true }));
    })
    .build();
app.listen(BACKEND_PORT, () => {
    logger.logInfo(`Server listening on port ${BACKEND_PORT}.`, "index.ts")
});