# REST API for polyglot e commerce model (Iteration 2)
The application is a Node.js REST API written in TypeScript.
It demonstrates a simple REST API that works with a polyglot persistence model (relational, graph and document database).
Following libraries have to be installed using *npm*.
They can be simply fetched by calling *npm update*:

* bcryptjs (for password hashing)
* cors
* dotenv (to manage the environment variables)
* express (REST API framework)
* express-form-data (to process HTTP FormData objects)
* gridfs-stream (to support storing of images and videos)
* inversify-express-utils (IoC container)
* jsonwebtoken (for JWT token handling)
* mongodb (for MongoDB)
* mongoose (for MongoDB)
* multer (for handling file uploads in FormData)
* @types/multer (multer for TypeScript)
* multer-gridfs-storage (GridFS storage engine for Multer to store uploaded files directly to MongoDB)
* neo4j
* neo4j-driver
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
* Runnning MongoDB cluster
* Running Redis server
* Running Neo4j server

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
	* NEO4J_URI (URI of the Neo4j server)
	* NEO4J_USERNAME (Neo4j username)
	* NEO4J_PASSWORD (Neo4j password)
	* MONGODB_URI (URI of the MongoDB cluster)
	* MONGODB_DATABASE (the MongoDB database)
	* IMAGES_BUCKET_NAME (name of the MongoDB bucket used to store images)
	* VIDEOS_BUCKET_NAME (name of the MongoDB bucket used to store videos)
2. Make sure that the databases mentioned in the previous step are running.
3. Configure other necessary information in the [config.ts](./src/config/config.ts) file.
4. Navigate to the [src](./src) folder and call *ts-node index.ts* in the command line.
5. The REST API is now running under the port specified in the [config.ts](./src/config/config.ts) file.
6. You can test the API using the HTTP methods described in the controllers
of the [api](./src/api) folder.