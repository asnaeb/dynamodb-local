import {x} from 'tar'
import {RequestOptions, request} from 'node:https'
import {pipeline} from 'node:stream/promises'
import {mkdir} from 'node:fs/promises'
import {backgrounds, colors, log, msg} from './shell'
import {DynamoDBLocalError} from './error'

export function downloadDynamoDB(destination: string, verbose?: boolean) {
    return new Promise<void>((resolve, reject) => {
        const url = new URL('/dynamodb-local/dynamodb_local_latest.tar.gz', 'https://s3.us-west-2.amazonaws.com/')
        const options: RequestOptions = {
            method: 'GET',
            host: url.host,
            path: url.pathname,
            protocol: url.protocol,
            timeout: 3000
        }

        const req = request(options, async res => {
            res.on('error', error => {
                if (verbose) process.stdout.write('\n')
                reject(!req.destroyed && new DynamoDBLocalError('network error', error.message, verbose))
            })

            const length = res.headers['content-length']

            try {
                if (length) {
                    let written = 0

                    await mkdir(destination, {recursive: true})
                    res.on('data', (data: Buffer) => {
                        if (verbose) {
                            written += data.byteLength
                            const percentage = Math.round((written * 100) / +length) + '%'
                            process.stdout.clearLine(0)
                            process.stdout.cursorTo(0)
                            process.stdout.write(
                                msg.info(`Downloading DynamoDB from ${url.host} `) + 
                                backgrounds.blue.bold(' ' + colors.white(percentage) + backgrounds.blue(' '))
                            )
                        }
                    })

                    res.on('end', () => {
                        if (verbose) {
                            process.stdout.clearLine(0)
                            process.stdout.cursorTo(0)
                        }
                    })

                    const untar = x({C: destination})
                    await pipeline(res, untar)
                    resolve(verbose ? log.success(`installation complete`) : undefined)
                }

                else throw new DynamoDBLocalError('error', 'Unable to determine response size', verbose)
            }

            catch (error: any) {
                if (verbose) process.stdout.write('\n')
                reject(new DynamoDBLocalError(error.name, error.message, verbose))
            }
        })

        req.on('timeout', async () => {
            req.destroy()
            if (verbose) process.stdout.write('\n')
            reject(new DynamoDBLocalError('network error', 'Request timed out', verbose))
        })

        req.on('error', async error => {
            if (verbose) process.stdout.write('\n')
            reject(new DynamoDBLocalError(error.name, error.message, verbose))
        })

        req.end()
    })
}