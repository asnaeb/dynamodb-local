import {DynamoDBLocal} from '../lib/index.js';

try {
    await DynamoDBLocal.start()
} 
catch (error) {
    console.log(error)
}
