import {DynamoDBLocal} from '../lib/index.js';

try {
    await DynamoDBLocal.install()
    await DynamoDBLocal.start({inMemory: true})
} 
catch (error) {
    console.log(error)
}
