# DynamoDBLocal
Install and run AWS DynamoDB locally via CLI or Javascript API.
<img src="sample.gif?raw=true" width="400px">
> **NOTE**:
> To run DynamoDB on your computer, you must have the Java Runtime Environment (JRE) version 8.x or newer installed. The application doesn't run on earlier JRE versions.
# Installation
```
npm i @asn.aeb/dybamodb-local
```
or, to install globally
```
npm i -g @asn.aeb/dybamodb-local
```
# CLI
The CLI API can be used via `npx dynamodb-local` when installed locally or by just calling `dynamodb-local` from your shell when installed with `-g` 
## `install`
Downloads and installs dynamodb or, if already installed, prompts to download the latest version and update the current installation.
```
dynamodb-local install 
```
## `uninstall`
Uninstalls dynamodb.
```
dynamodb-local uninstall 
```

## `start`
Starts dynamodb or, if not installed, prompts to install it and, on positive response, will install and then immediately start the service.
```
dynamodb-local start
```
The command can take the following arguments:
#### `--cors`
An allow list of specific domains separated by comma. Defaults to *
```
dynamodb-local start --cors=my.domain.com,my-other-domain.com
```
#### `---dbPath`
The directory where DynamoDB writes its database file. Defaults to `{install dir}/DynamoDBLocal_db`. Cannot be used along with `--inMemory`.
```
dynamodb-local start --dbPath=path/to/directory
```
#### `--delayTransientStatuses`
Causes DynamoDB to introduce delays for certain operations, simulating the behavior of the DynamoDB web service more closely.
```
dynamodb-local start --delayTransientStatuses
```
#### `--inMemory`
DynamoDB runs in memory instead of using a database file. Cannot be used along with `--dbPath`.
```
dynamodb-local start --inMemory
```
#### `--port`
The port number that dynamodb uses. Defaults to 8000
```
dynamodb-local start --port=3000
```
#### `--sharedDb`
DynamoDB uses a single database file instead of separate files for each credential and Region.
```
dynamodb-local --sharedDb
```

For more info about these options, see the [aws documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html)
## The `--path` argument
All CLI commands can take the `--path` argument which indicates to run that command relative to a custom path where a dynamodb installation resides. Most of the times you won't need this. When omitted, the default install location will be used: `{package root}/node_modules/@asn.aeb/dynamodb-local/dynamodb`.
```
dynamodb-local install --path=path/to/directory
```
```
dynamodb-local uninstall --path=path/to/directory
```
```
dynamodb-local start --path=path/to/directory
```
# Javascript 
The Javascript API can be run from Node >= 14. The package exports a single class called `DynamoDBLocal` and the `DynamoDBOptions` interface for Typescript. 
## `DynamoDBLocal`
To use the default install location (recommended), You won't need to instantiate the class, just use its static methods. The methods return promises and may prompt to the console. If the returned promises reject, errors are automatically printed to the console so you don't need to `catch (error) {console.log(error)}`
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

await DynamoDBLocal.install()
await DynamoDBLocal.start()
await DynamoDBLocal.stop()
await DynamoDBLocal.uninstall()
```
If you want to use a custom install location, You'll need to instantiate the class, passing your path to the constructor.
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

const dynamodbLocal = new DynamoDBLocal('path/to/directory')
await dynamodbLocal.install()
await dynamodbLocal.start()
await dynamodbLocal.stop()
await dynamodbLocal.uninstall()
```
## `install`
Same as calling [`dynamodb-local install`](#install). Returns a promise that resolves to `void` when the installation is complete or rejects if there is some error.
### Example
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

try {
    await DynamoDBLocal.install()

    // OR

    const ddb = new DynamoDBLocal('path/to/dir')
    await ddb.install()
}

catch {}
```
## `uninstall`
Same as calling [`dynamodb-local uninstall`](#uninstall). Returns a promise that resolves to `void` when the uninstallation is complete or rejects if there is some error.
### Example
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

try {
    await DynamoDBLocal.uninstall()

    // OR

    const ddb = new DynamoDBLocal('path/to/dir')
    await ddb.uninstall()
}

catch {}
```
## `start`
Same as calling [`dynamodb-local start`](#start). Returns a promise that resolves to `void` when dynamodb has started or rejects if there is some error. Optionally, takes an object as the only argument with the following shape:
```typescript
interface DynamoDBOptions {
    cors?: string[]
    dbPath?: string
    delayTransientStatuses?: boolean
    inMemory?: boolean
    port?: number
    sharedDB?: boolean
} 
```
For info about these options, [see above](#start).
### Example
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

try {
    await DynamoDBLocal.start({inMemory: true, port: 3000})

    // OR

    const ddb = new DynamoDBLocal('path/to/dir')
    await ddb.start({cors: ['my.domain.com', 'my-other-domain.com']})
}

catch {}
```
## `stop`
Terminate the dynamodb process if it is still executing. You don't need to call this before exiting the main Node.js process, it will automatically terminate. If multiple dynamodb processes are running, only the one associated with the instance on which `stop` is called will be terminated. 
### Example
```javascript
import {DynamoDBLocal} from '@asn.aeb/dynamodb-local'

try {
    await DynamoDBLocal.start()
    // ..do your stuff
    await DynamoDBLocal.stop()

    // OR

    const ddb_0 = new DynamoDBLocal('path/to/dir')
    const ddb_1 = new DynamoDBLocal('path/to/another/dir')
    
    await ddb_0.start({port: 3000})
    await ddb_1.start({port: 3001})
    // ..do your stuff
    await ddb_0.stop()
    // ddb_1 is still running
    await ddb_1.stop()
    // ddb_1 is stopped as well
}

catch {}
```
