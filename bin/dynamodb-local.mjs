#!/usr/bin/env node

//@ts-check

import {DynamoDBLocalCLI} from '../lib/dynamodb-local.js';
import {log, styles} from '../lib/shell.js';

/** @type {typeof DynamoDBLocalCLI | DynamoDBLocalCLI} */
let ddbLocal = DynamoDBLocalCLI;
/** @type {import('../src/dynamodb-local.js').DynamoDBOptions}*/
let options = {};

switch (process.argv[2]) {
    case 'install': {
        const path = process.argv.find(e => e.startsWith('--path='))
            ?.replace('--path=', '');

        if (path) {
            ddbLocal = new DynamoDBLocalCLI(path);
        }

        try {await ddbLocal.install()} catch {};
        break;
    }

    case 'uninstall': {
        const path = process.argv.find(e => e.startsWith('--path='))
            ?.replace('--path=', '');
        
        if (path) {
            ddbLocal = new DynamoDBLocalCLI(path);
        }

        try {await ddbLocal.uninstall()} catch {};
        break;
    }

    case 'start': {
        // TODO --help argument
        const path = process.argv.find(e => e.startsWith('--path='))?.replace('--path=', '');
        const port = process.argv.find(e => e.startsWith('--port='));
        const inMemory = process.argv.find(e => e === '--inMemory');
        const dbPath = process.argv.find(e => e.startsWith('--dbPath='));
        const delayTransientStatuses = process.argv.find(e => e === '--delayTransientStatuses');
        const cors = process.argv.find(e => e.startsWith('--cors=')); 
        const sharedDb = process.argv.find(e => e === '--sharedDb');

        if (port) {
            const maybeInt = parseInt(port.replace('--port=', ''));
            if (Number.isInteger(maybeInt)) {
                options.port = maybeInt;
            }
        }

        if (cors) {
            options.cors = cors.replace('--cors=', '').split(',');
        }

        if (dbPath) {
            options.dbPath = dbPath.replace('--dbPath=', '');
        }

        if (inMemory) {
            options.inMemory = true;
        }

        if (delayTransientStatuses) {
            options.delayTransientStatuses = true;
        }

        if (sharedDb) {
            options.sharedDB = true;
        }
        
        if (path) {
            ddbLocal = new DynamoDBLocalCLI(path);
        }

        try {await ddbLocal.start(options)} catch {}
        break;
    }

    default: {
        // TODO usage info
        if (!process.argv[2]) {
            log.error('invalid argument', 'An argument must be provided');
        }

        else {
            log.error('invalid argument', `Argument ${styles.bold(process.argv[2])} is not a valid argument`)
        }
    }
}
