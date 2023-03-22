import {spawn, type ChildProcess} from 'node:child_process'
import {rm, mkdir, readdir} from 'node:fs/promises'
import {join, normalize, resolve as path_resolve, parse} from 'node:path'
import {Interface, createInterface} from 'node:readline/promises'
import {DynamoDBLocalError} from './error'
import {libIndex} from './lib-index'
import {styles, msg, log} from './shell'
import {downloadDynamoDB} from './download-dynamodb'

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

function bound<T extends DynamoDBLocalBuilder, A extends any[], R>(
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

abstract class DynamoDBLocalBuilder {
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
    readonly #verbose
    #dynamodb?: ChildProcess

    protected constructor(path: string, options?: {verbose: boolean}) {
        this.#path = path_resolve(normalize(path))
        if (options?.verbose) this.#verbose = true
        process.on('exit', () => this.#dynamodb?.connected && this.stop())
    }

    async #generateArgs({cors, port, inMemory, dbPath, sharedDB, delayTransientStatuses}: DynamoDBOptions) {
        const libpath = join(this.#path, 'DynamoDBLocal_lib')
        const jarpath = join(this.#path, 'DynamoDBLocal.jar')
        const args = [`-Djava.library.path=${libpath}`, `-jar`, jarpath]
        if (Array.isArray(cors) && cors?.length && cors.every(c => typeof c === 'string'))
            args.push('-cors', cors.join(', '))

        if (port !== undefined) {
            if (Number.isInteger(port)) args.push('-port', String(port))
            else throw new DynamoDBLocalError('config error', 'Port must be an Integer', this.#verbose)
        }

        if (inMemory) {
            if (!dbPath) args.push('-inMemory')
            else throw new DynamoDBLocalError(
                'config error',
                `When option ${styles.underline('dbPath')} is set, option ${styles.underline('inMemory')} cannot be used and must be omitted`,
                this.#verbose
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
        const installed = await DynamoDBLocalBuilder.#find(this.#path)
        if (!installed) {
            throw new DynamoDBLocalError('error', 'DynamoDB is not installed at ' + styles.underline(this.#path), this.#verbose)
        }

        if (this.#path === defaultPath) {
            try {
                await rm(this.#path, {recursive: true})
                return this.#verbose ? log.info('DYNAMODB UNINSTALLED') : undefined
            }

            catch (error: any) {
                throw new DynamoDBLocalError(error.name, error.message, this.#verbose)
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
                throw new DynamoDBLocalError(
                    'uninstall error',
                    `The following files could not be removed: [${rejected.join(', ')}]`,
                    this.#verbose
                )
            }

            else {
                if (this.#verbose) log.warning(
                    `DynamoDB was successfully uninstalled but the following files were not removed: [${rejected.join(', ')}]`
                )
            }
        }

        else {
            if (this.#verbose) log.info('DYNAMODB UNINSTALLED')
        }
    }

    @bound public async install({update}: {update?: boolean} = {}) {
        const installed = await DynamoDBLocalBuilder.#find(this.#path)
        if (installed) {
            if (this.#verbose) {
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

            else if (!update) {
                return
            }
        }

        return downloadDynamoDB(this.#path, this.#verbose)
    }

    @bound public async start(args?: DynamoDBOptions & {install?: boolean}) {
        if (!this.#dynamodb) {
            const installed  = await DynamoDBLocalBuilder.#find(this.#path)
            if (!installed) {
                if (this.#verbose) {
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

                    finally {
                        input?.close()
                    }
                }

                else if (args?.install) {
                    await this.install()
                }

                else throw new DynamoDBLocalError('error', 'DynamoDB not found at ' + styles.underline(this.#path), this.#verbose)
            }

            const $args = await this.#generateArgs(args ?? {})
            if (this.#verbose) process.stdout.write(msg.info('Initializing DynamoDB'))
            this.#dynamodb = spawn('java', $args, {shell: true})
            this.#dynamodb.on('exit', () => this.#verbose && log.fail('dynamodb terminated'))
            const interval = this.#verbose ? setInterval(() => process.stdout.write('.'), 200) : undefined
            return new Promise<void>((resolve, reject) => {
                this.#dynamodb!.on('error', error => {
                    clearInterval(interval)
                    reject(new DynamoDBLocalError(error.name, error.message, this.#verbose))
                })

                this.#dynamodb!.stdout?.on('data', data => {
                    if (String(data).match(/CorsParams/)) setTimeout(() => {
                        clearInterval(interval)
                        if (this.#verbose) {
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
                        }
                        resolve()
                    }, 2000)
                })

                this.#dynamodb!.on('error', error => {
                    clearInterval(interval)
                    if (this.#verbose) process.stdout.write('\n')
                    reject(new DynamoDBLocalError(error.name, error.message, this.#verbose))
                })
            })
        }

        const {pid} = this.#dynamodb
        throw new DynamoDBLocalError(
            'error',
            `DynamoDB process is already running with pid: ${styles.underline(String(pid))}`,
            this.#verbose
        )
    }

    @bound public stop() {
        const killed = this.#dynamodb?.kill()

        if (killed) {
            this.#dynamodb = undefined
            return this.#verbose ? log.info('DynamoDB process terminated') : undefined
        }

        return Promise.reject(new DynamoDBLocalError(
            'error',
            'Requested DynamoDB process not killed because it was not running',
            this.#verbose
        ))
    }
}

export class DynamoDBLocalCLI extends DynamoDBLocalBuilder {
    static readonly #default = new this(defaultPath)
    public static install() {return this.#default.install()}
    public static uninstall() {return this.#default.uninstall()}
    public static start(args?: DynamoDBOptions) {return this.#default.start(args)}
    public static stop() {return this.#default.stop()}
    constructor(path: string) {
        super(path, {verbose: true})
    }
}

export class DynamoDBLocal extends DynamoDBLocalBuilder {
    static readonly #default = new this(defaultPath)
    public static install() {return this.#default.install()}
    public static uninstall() {return this.#default.uninstall()}
    public static start(args?: DynamoDBOptions & {install?: boolean}) {return this.#default.start(args)}
    public static stop() {return this.#default.stop()}
    constructor(path: string) {
        super(path, {verbose: false})
    }
}

