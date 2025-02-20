# REST API for relational e commerce model (Iteration 1)
The application is a Node.js REST API written in TypeScript.
It demonstrates a simple REST API that works with a relational model.
Following libraries have to be installed using *npm*. 
They can be simply fetched by calling *npm update*:

* bcryptjs (for password hashing)
* cors
* dotenv (to manage the environment variables)
* express (REST API framework)
* inversify-express-utils (IoC container)
* jsonwebtoken (for JWT token handling)
* redis (for session management)
* sequelize (ORM framework that facilitates work with relational databases)
* swagger-express-ts
* tedious (MSSQL client for Node.js)

## Project structure
```
.
└── src/
    ├── api
    ├── config
    ├── core/
    │   ├── ioc
    │   └── services
    ├── models
    └── index.ts
```
The folder *src* contains the main project.
The folder *api* contains controllers with HTTP methods used to access the REST API.
The folder *config* contains files with global configuration information.
The folder *core* contains subfolders *ioc* and *services*.
The folder *ioc* contains a file initializing the inversion-of-control-container
that registers all necessary services and controllers.
The folder *services* contains services that encapsulate the business logic of the 
REST API.
The folder *models* represents classes that encapsulate entity-related
information as objects.
The file *index.ts* is the main entry of the program.

## Prerequisites
* Node.js (version at least v18.0.0) 
* Running MSSQL server
* Running Redis server

## Start the REST API
1. Configure all necessary information in a *.env* file
with the following variables and paste it into the [src](./src) folder:
* MSSQL_DB (the MSSQL database)
* MSSQL_USER (the MSSQL user)
* MSSQL_PASSWORD (the MSSQL password)
* MSSQL_HOST (the MSSQL host)
* MSSQL_PORT (the MSSQL port)
* REDIS_HOST (the Redis host)
* REDIS_PORT (the Redis port)
* SESSIONS_HASH (name of the Redis hash used to store session information)
* ADMIN_ID (ID used to identify the administrator)
2. Make sure that the databases mentioned in the previous step are running.
3. Configure other necessary information in the [config.ts](./src/config.ts) file.
4. Navigate to the [src](./src) folder and call *ts-node index.ts* in the command line.
5. The REST API is now running under the port specified in the [config.ts](./src/config.ts) file.
6. You can test the API using the HTTP methods described in the controllers
of the [api](./src/api) folder.