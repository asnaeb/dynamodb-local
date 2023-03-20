import {spawn, type ChildProcess} from 'node:child_process'
import {type FileHandle, open, mkdtemp, rm, mkdir, readdir} from 'node:fs/promises'
import {RequestOptions, request} from 'node:https'
import {join, normalize, resolve as path_resolve, parse} from 'node:path'
import {Interface, createInterface} from 'node:readline/promises'
import {libIndex} from './lib-index'
import {backgrounds, styles, msg, log} from './shell'

export interface DynamoDBOptions {
    /**
     * Enables support for cross-origin resource sharing (CORS) for JavaScript. 
     * You must provide an *allow* list of specific domains in the form of an array of strings. 
     * The default setting for `cors` is an asterisk (*), which allows public access.
     */
    cors?: string[]
    /**
     * The directory where DynamoDB writes its database file. If you don't specify this option, 
     * the file is written to DynamoDB installation directory. You can't specify both `dbPath` and `inMemory` at once.
     */
    dbPath?: string
    /**
     * Causes DynamoDB to introduce delays for certain operations. 
     * DynamoDBLocal can perform some tasks almost instantaneously, such as create/update/delete operations 
     * on tables and indexes. However, the DynamoDB web service requires more time for these tasks. 
     * Setting this parameter helps DynamoDB running on your computer simulate the behavior of the 
     * DynamoDB web service more closely. (Currently, this parameter introduces delays only for global 
     * secondary indexes that are in either CREATING or DELETING status.)
     */
    delayTransientStatuses?: boolean
    /**
     * DynamoDB runs in memory instead of using a database file. When you stop DynamoDB, 
     * none of the data is saved. You can't specify both `dbPath` and `inMemory` at once.
     */
    inMemory?: boolean
    /**
     * The port number that DynamoDB uses to communicate with your application. 
     * If you don't specify this option, the default port is `8000`.
     */
    port?: number
    /**
     * If you specify `sharedDB`, DynamoDB uses a single database file instead of 
     * separate files for each credential and Region.
     */
    sharedDB?: boolean
} 

function bound<T extends DynamoDBLocal, A extends any[], R>(
    method: (this: T, ...args: A) => R, 
    {name, addInitializer}: ClassMethodDecoratorContext<T, (this: T, ...args: A) => R> &
    {name: keyof T, kind: 'method', static: false, private: false}
) {
    addInitializer(function (this: T) {
        const method = this[name] as Function
        this[name] = method.bind(this)
    })
}

const defaultPath = join(__dirname, '..', 'dynamodb')

/** @argument path  */
export class DynamoDBLocal {
    static readonly #default = new this(defaultPath)
    public static install() {return this.#default.install()}
    public static uninstall() {return this.#default.uninstall()}
    public static start(args?: DynamoDBOptions) {return this.#default.start(args)}
    public static stop() {return this.#default.stop()}

    static async #buildLibIndex() {
        // TODO fetch files and create lib index
    }

    static async #find(path: string) {
        path = path_resolve(normalize(path))
        try {
            const files = await readdir(path, {withFileTypes: true})
            const jar = files.some(file => file.name === 'DynamoDBLocal.jar' && file.isFile())
            const lib = files.some(file => file.name === 'DynamoDBLocal_lib' && file.isDirectory())

            if (jar && lib) {
                const libFiles = await readdir(join(path, 'DynamoDBLocal_lib'))
                if (libIndex.every(file => libFiles.includes(file))) {
                    return true
                }
            }
        }
        
        catch {}

        return false
    }

    readonly #path
    #dynamodb?: ChildProcess

    constructor(path: string) {
        this.#path = path_resolve(normalize(path))
        process.on('exit', code => this.#dynamodb?.connected && this.stop())
    }

    async #generateArgs({cors, port, inMemory, dbPath, sharedDB, delayTransientStatuses}: DynamoDBOptions) {
        const libpath = join(this.#path, 'DynamoDBLocal_lib')
        const jarpath = join(this.#path, 'DynamoDBLocal.jar')
        const args = [`-Djava.library.path=${libpath}`, `-jar`, jarpath]
        if (Array.isArray(cors) && cors?.length && cors.every(c => typeof c === 'string'))
            args.push('-cors', cors.join(', '))

        if (port !== undefined) {
            if (Number.isInteger(port)) args.push('-port', String(port))
            else throw log.error('config error', 'Port must be an Integer')
        }

        if (inMemory) {
            if (!dbPath) args.push('-inMemory')
            else throw log.error(
                'config error', 
                `When option ${styles.underline('dbPath')} is set, option ${styles.underline('inMemory')} cannot be used and must be omitted`
            )
        }

        if (dbPath && typeof dbPath === 'string') {
            if (!inMemory) {
                const path = path_resolve(normalize(dbPath))
                try {await mkdir(path, {recursive: true})} catch {}
                args.push('-dbPath', path, '-optimizeDbBeforeStartup')
            }
        }

        if (!dbPath && !inMemory) {
            const path = join(this.#path, 'DynamoDBLocal_db')
            try {await mkdir(path, {recursive: true})} catch {}
            args.push('-dbPath', path)
        }

        if (delayTransientStatuses) 
            args.push('-delayTransientStatuses')

        if (sharedDB) 
            args.push('-sharedDb')

        return args
    }

    @bound public async uninstall() {
        const installed = await DynamoDBLocal.#find(this.#path)
        if (!installed) {
            return log.error('error', 'DynamoDB is not installed at ' + styles.underline(this.#path))
        }

        if (this.#path === defaultPath) {
            try {
                await rm(this.#path, {recursive: true})
                return log.info('DYNAMODB UNINSTALLED')
            }

            catch (error: any) {
                return log.error('uninstall error', error.message)
            }
        }

        const files = [
            join(this.#path, 'DynamoDBLocal_lib'),
            join(this.#path, 'DynamoDBLocal.jar'),
            join(this.#path, 'LICENSE.txt'),
            join(this.#path, 'README.txt'),
            join(this.#path, 'THIRD-PARTY-LICENSES.txt')
        ]

        const promises = files.map(file => rm(file, {recursive: true}))
        const settled = await Promise.allSettled(promises)
        const rejected: string[] = []

        settled.forEach((e, i) => {
            if (e.status === 'rejected') {
                rejected.push(parse(files[i]).name)
            }
        })

        if (rejected.length) {
            if (rejected.includes('DynamoDBLocal_lib') || rejected.includes('DynamoDBLocal.jar')) {
                log.error('uninstall error', `The following files could not be removed: [${rejected.join(', ')}]`)
            }

            else {
                log.warning(`DynamoDB was successfully uninstalled but the following files were not removed: [${rejected.join(', ')}]`)
            }
        }
        
        else {
            log.info('DynamoDB was successfully uninstalled')
        }
    }

    @bound public async install() {
        const installed = await DynamoDBLocal.#find(this.#path)
        if (installed) {
            let input: Interface | undefined;
            try {
                const question = msg.warning('DynamoDB is already installed at: ' + styles.underline(this.#path)) + `\n` + 
                msg.info('Overwrite current installation? (Y/N): ')
                input = createInterface(process.stdin, process.stdout)
                const answer = await input.question(question)
                if (!['yes', 'y', 'ok'].includes(answer.toLowerCase())) {
                    return log.fail('installation canceled')
                }
            }

            finally {
                input?.close()
            }
        }

        return new Promise<void>((resolve, reject) => {
            const url = new URL('/dynamodb-local/dynamodb_local_latest.tar.gz', 'https://s3.us-west-2.amazonaws.com/')
            const options: RequestOptions = {
                method: 'GET',
                host: url.host,
                path: url.pathname,
                protocol: url.protocol,
                timeout: 3000
            }

            let handle: FileHandle | undefined
            let tmpdir: string | undefined

            const req = request(options, async res => {
                res.on('error', error => reject(
                    !req.destroyed && log.error('network error', error.message)
                ))

                const length = res.headers['content-length']
    
                if (length) {
                    let written = 0
                    let finished = false
    
                    try {
                        await mkdir(this.#path, {recursive: true})
                        const tmpath = join(this.#path, 'ddb-local-')
                        tmpdir = await mkdtemp(tmpath)
                        const tgzdir = join(tmpdir, 'ddb.tar.gz')
                        handle = await open(tgzdir, 'w')
                        const ws = handle.createWriteStream()
                        res.on('data', (data: Buffer) => {
                            ws.write(data)
                            written += data.byteLength
                            const percentage = Math.round((written * 100) / +length) + '%'
                            if (!finished) {
                                process.stdout.clearLine(0)
                                process.stdout.cursorTo(0)
                                process.stdout.write(
                                    msg.info(`Downloading DynamoDB from ${url.host} `) + backgrounds.blue.bold(' ' + percentage + ' ')
                                )
                            }
                        })
    
                        await new Promise<void>(resolve => {
                            res.on('end', () => {
                                if (res.complete) {
                                    finished = true
                                    process.stdout.clearLine(0)
                                    process.stdout.cursorTo(0)
                                    process.stdout.write(msg.info('Extracting'))
                                    const interval = setInterval(() => process.stdout.write('.'), 60)
                                    const tar = spawn('tar', ['xf', tgzdir, '--directory', this.#path])
                                    let stderr = ''
                                    tar.stderr.on('data', data => stderr += data)
                                    tar.on('exit', async code => {
                                        clearInterval(interval)
                                        process.stdout.clearLine(0)
                                        process.stdout.cursorTo(0)
                                        if (code === 0) {
                                            log.success(`installation complete`)
                                            resolve()
                                        }

                                        else {
                                            log.error('extraction error', stderr.replace('tar: ', ''))
                                            reject(log.fail('installation canceled'))
                                        }
                                    })
                                }
    
                                else {
                                    log.error('network error', 'Response terminated before completion')
                                    reject(log.fail('installation canceled'))
                                }
                            })
                        })
                    }

                    catch (error: any) {
                        log.error('error', error.message)
                        process.exit(0)
                    }
    
                    finally {
                        if (tmpdir) try {await rm(tmpdir, {recursive: true})} catch {}
                        await handle?.close()
                    }

                    resolve()
                }
            })

            req.on('timeout', async () => {
                if (tmpdir) try {await rm(tmpdir, {recursive: true})} catch {}
                req.destroy()
                process.stdout.write('\n')
                log.error('network error', 'Request timed out')
                reject(log.fail('installation canceled'))
            })

            req.on('error', async error => {
                if (tmpdir) try {await rm(tmpdir, {recursive: true})} catch {}
                log.error('network error', error.message)
                reject(log.fail('installation canceled'))
            })

            req.end()
        })
    }

    @bound public async start(args?: DynamoDBOptions) {
        if (!this.#dynamodb) {
            const installed  = await DynamoDBLocal.#find(this.#path)
            if (!installed) {
                log.warning('DynamoDB not found at ' + styles.underline(this.#path))
                let input
                try {
                    input = createInterface(process.stdin, process.stdout)
                    const answer = await input.question(msg.info('Do you want to download and install now? (Y/N): '))
                    if (!['y', 'yes', 'ok'].includes(answer.toLowerCase())) {
                        return 
                    }

                    await this.install()
                }

                catch (error: any) {
                    log.error('error', error.message)
                }

                finally {
                    input?.close()
                }
            }

            const $args = await this.#generateArgs(args ?? {})
            process.stdout.write(msg.info('Initializing DynamoDB'))
            this.#dynamodb = spawn('java', $args, {shell: true})
            this.#dynamodb.on('exit', () => log.fail('dynamodb terminated'))
            const interval = setInterval(() => process.stdout.write('.'), 200)
            return new Promise<void>((resolve, reject) => {
                this.#dynamodb!.on('error', error => {
                    clearInterval(interval)
                    reject(log.error('dynamodb error', error.message))
                })

                this.#dynamodb!.stdout?.on('data', data => {
                    if (String(data).match(/CorsParams/)) setTimeout(() => {
                        clearInterval(interval)
                        process.stdout.clearLine(0)
                        process.stdout.cursorTo(0)
                        process.stdout.write(msg.success('dynamodb started') + '\n')
                        console.log(msg.info('port: ') + (args?.port || '8000 '))
                        console.log(msg.info('inMemory: ') + (args?.inMemory ? 'true' : 'false'))
                        console.log(msg.info('dbPath: ') + (args?.inMemory ? '-' : path_resolve(args?.dbPath ?? join(this.#path, 'DynamoDBLocal_db'))))
                        console.log(msg.info('sharedDB: ') + (args?.sharedDB ? 'true' : 'false'))
                        console.log(msg.info('delayTransientStatuses: ') + (args?.delayTransientStatuses ? 'true'  : 'false'))
                        console.log(msg.info('cors: ') + '[' + (args?.cors?.join(', ') ?? '*') + ']')
                        console.log(msg.message(`press ${styles.bold('CTRL + C')} to terminate`))
                        resolve()
                    }, 2000)
                })

                this.#dynamodb!.stderr?.on('data', data => {
                    clearInterval(interval)
                    process.stdout.write('\n')
                    log.error('dynamodb error', String(data))
                    reject(`${data}`)
                })
            })
        }

        const {pid} = this.#dynamodb

        return Promise.resolve(log.warning(`DynamoDB process is already running with pid: ${styles.underline(String(pid))}`))
    }

    @bound public stop() {
        const killed = this.#dynamodb?.kill()

        if (killed) {
            return Promise.resolve(this.#dynamodb = undefined)
        }

        return Promise.resolve(log.warning('Requested DynamoDB not killed because it was not running'))
    }
}

