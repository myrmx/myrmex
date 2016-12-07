---
title: Creating APIs for the space delivery company "Planet Express"
keywords: lager, iam, api-gateway, lambda
last_updated: Nov 28, 2016
tags: [getting_started, tutorial, iam, api-gateway, lambda]
summary: "I this tutorial, we will follow the steps to create an application that expose several APIs .
We will create some IAM roles, a Lambda that should contain the application logic, and define several APIs that will expose some endpoints."
sidebar: home_sidebar
permalink: planet-express.html
folder: tutorials
---

The need: one application, several APIs exposing various functionalities
---

*Planet Express* is a space delivery company that have two types of customers :

*   **Senders** like *MomCorp* and the *Slurm factory* that use *Planet Express* services to deliver products
*   **Recipients** like the *Luna Park* or the *Mars Vegas Casinos* that receive these products

*Planet Express*, as a *futurist* company, wants to provide *serverless APIs*, web and mobile applications for their customers.

*   **Senders** need an API to create and track deliveries
*   **Recipients** need an API to track and validate the reception of deliveries
*   *Planet Express* also needs an API for its **Back Office** application that manage all deliveries

Following REST principles, a simplified API implementing these functionalities should expose these endpoints :

*   `PUT /delivery` to create of a new delivery
*   `GET /delivery/{id}` to allow to track a delivery
*   `PATCH /delivery/{id}` to modify a delivery
*   `DELETE /delivery/{id}` to delete a delivery

We state that a **sender** cannot modify a delivery once created and a **recipient** deletes a delivery when it receives it.

*Planet Express* wants to provide an `OpenAPI` (aka `Swagger`) specification to document the endpoints for development teams that integrate the services.

To avoid exposing and documenting endpoints not needed by some API consumers, *Planet Express* wants a specific API for each type of client application :
`sender`, `recipient` and `back-office`.

These three APIs belong to the same application and share the same code base. The `back-office` API will provide access to all functionalities while the
consumers of the `sender` and the `recipient` APIs will only have access to endpoints that are useful for them.

|                          | `sender` | `recipient` | `back-office` |
| :----------------------- | :------: | :---------: | :-----------: |
| `PUT /delivery`          | X        |             | X             |
| `GET /delivery/{id}`     | X        | X           | X             |
| `PATCH /delivery/{id}`   |          |             | X             |
| `DELETE /delivery/{id}`  |          | X           | X             |

We will not see the implementation of authentication and authorization here. Neither will we see the implementation of the data access. These are aspects
of the application that do not rely on `Lager`. They are implemented in `node.js` modules that could run in any execution environment.

The creation of the application with `Lager`
---

For each command used in the following sections, it is possible to see its documentation using `lager <command> -h`. Note that the `Lager` cli itself only contains
the command `lager new`. Other commands are injected by `Lager` plugins when the cli is executed in the project folder.

### Initialization of the project

We create a new `Lager` project named `planet-express`.

```bash
npm install -g @lager/cli
lager new planet-express @lager/iam @lager/api-gateway @lager/node-lambda
cd planet-express
```

### Creation of the Lambda containing the application logic

We are free to use as many Lambdas as we want in a Lager project. For example, we could associate one specific Lambda for each endpoint. But the
*Planet Express* development team choose to put all the logic of the application in one single Lambda. Parameters provided by API Gateway will allow
the lambda to know which portions of code to execute.

#### Creation of the Lambda's execution role

The Lambda needs to be associated to an IAM role that defines its authorizations in AWS. It could be authorized to access DynamoDB, RDS or S3 depending on the
implementation of the application. For now, we use a role that allows the Lambda to write logs in CloudWatch.

```bash
lager create-role PlanetExpressLambdaExecution -p LambdaBasicExecutionRole
lager deploy-roles PlanetExpressLambdaExecution -e DEV -s v0
```

#### Creation of node modules that can be packaged in the Lambda

`Lager` allows the creation of node modules that can be embedded in the package of the Lambda. The development team decided that they will need two modules:

*   A logging module that should allow to write logs in various backends (Cloudfront, S3, a database, etc ...)
*   A module that manage the access to the application data (DynamoDB, Sequelize, mongoose, etc ...)

The data access module uses the logging module. We indicate this dependency so that if a Lambda requires the data access module, it will include the logging
module in its package too.

```bash
lager create-node-module log
lager create-node-module data-access -d log
```

The implementation of the modules will not be detailed here, but they are "common" `node.js` modules that could be used in any execution environment.

#### Creation of a Lambda

We create a Lambda using a basic handler provided by `Lager` as a commodity. But the development team is free to implement the handler to its convenience.
This handler provided by `@lager/node-lambda` integrates with the configuration of `@lager/api-gateway`.

```bash
lager create-node-lambda api-generic -t 20 -m 256 -r PlanetExpressLambdaExecution --template api-endpoints --modules data-access,log
```

### Creation of the endpoints and APIs

Now that we have a Lambda able to perform the operations needed by our application, we can define the endpoints that integrate with it and expose them in
various APIs.

#### Creation of the APIs

We create one API for each type of client application.

```bash
lager create-api back-office -t "Back Office" -d "Planet Express API for Back Office"
lager create-api sender      -t "Sender"      -d "Planet Express API for sender application"
lager create-api recipient   -t "Recipient"   -d "Planet Express API for recipient application"
```

#### Creation of the invocation role

The API endpoints need to be associated to an IAM role that allows to invoke the Lambda.

```bash
lager create-role PlanetExpressLambdaInvocation -p APIGatewayLambdaInvocation
lager deploy-roles PlanetExpressLambdaInvocation -e DEV -s v0
```

#### Creation of the endpoints

We create the four endpoints and associate them to the APIs that have to expose them.

```bash
lager create-endpoint /delivery get -a back-office,recipient,sender -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery patch -a back-office -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery put -a back-office,sender -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery delete -a back-office,recipient -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
```

### Deployment

We deploy the stage `v0` of the three APIs on the `DEV` environment.

```bash
lager deploy-apis back-office sender recipient -r us-east-1 -s v0 -e DEV
```

Altogether
---

```bash
npm install -g @lager/cli
lager new planet-express @lager/iam @lager/api-gateway @lager/node-lambda
cd planet-express

lager create-role PlanetExpressLambdaExecution -p LambdaBasicExecutionRole
lager deploy-roles PlanetExpressLambdaExecution -e DEV -s v0

lager create-node-module log
lager create-node-module data-access -d log

lager create-node-lambda api-generic -t 20 -m 256 -r PlanetExpressLambdaExecution --template api-endpoints --modules data-access,log

lager create-api back-office -t "Back Office" -d "Planet Express API for Back Office"
lager create-api sender      -t "Sender"      -d "Planet Express API for sender application"
lager create-api recipient   -t "Recipient"   -d "Planet Express API for recipient application"

lager create-role PlanetExpressLambdaInvocation -p APIGatewayLambdaInvocation
lager deploy-roles PlanetExpressLambdaInvocation -e DEV -s v0

lager create-endpoint /delivery get -a back-office,recipient,sender -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery patch -a back-office -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery put -a back-office,sender -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic
lager create-endpoint /delivery delete -a back-office,recipient -s "View a delivery" -c "application/json" -p "application/json" --auth none --credentials PlanetExpressLambdaInvocation -l api-generic

lager deploy-apis back-office sender recipient -r us-east-1 -s v0 -e DEV
```