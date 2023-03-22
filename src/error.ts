import {msg, log} from './shell'
import {inspect} from 'node:util'

export class DynamoDBLocalError extends Error {
    constructor(name: string, message: string, verbose?: boolean) {
        super()
        this.name = name
        this.message = message
        if (verbose) {
            log.error(name, message)
        }
    }
    [inspect.custom]() {
        return msg.error(this.name, this.stack || this.message)
    }
}