enum Colors {
    PURPLE = '\x1b[35m',
    PURPLE_BOLD = '\x1b[1;35m',
    PURPLE_UNDERLINE = '\x1b[4;35m',
    PURPLE_REVERSE = '\x1b[7;35m',
    GREEN = '\x1b[32m',
    GREEN_BOLD = '\x1b[1;32m',
    GREEN_UNDERLINE = '\x1b[4;32m',
    GREEN_REVERSE = '\x1b[7;32m',
    YELLOW = '\x1b[33m',
    YELLOW_BOLD = '\x1b[1;33m',
    YELLOW_UNDERLINE = '\x1b[4;33m',
    YELLOW_REVERSE = '\x1b[7;33m',
    BLACK = "\x1b[30m",
    BLACK_BOLD = "\x1b[1;30m",
    BLACK_UNDERLINE = "\x1b[4;30m",
    BLACK_REVERSE = "\x1b[7;30m",
    RED = "\x1b[31m",
    RED_BOLD = "\x1b[1;31m",
    RED_UNDERLINE = "\x1b[4;31m",
    RED_REVERSE = "\x1b[7;31m",
    BLUE = "\x1b[34m",
    BLUE_BOLD = "\x1b[1;34m",
    BLUE_UNDERLINE = "\x1b[4;34m",
    BLUE_REVERSE = "\x1b[7;34m",
    CYAN = "\x1b[36m",
    CYAN_BOLD = "\x1b[1;36m",
    CYAN_UNDERLINE = "\x1b[4;36m",
    CYAN_REVERSE = "\x1b[7;36m",
    WHITE = "\x1b[37m",
    WHITE_BOLD = "\x1b[1;37m",
    WHITE_UNDERLINE = "\x1b[4;37m",
    WHITE_REVERSE = "\x1b[7;37m",
    GRAY = "\x1b[90m",
    GRAY_BOLD = "\x1b[1;90m",
    GRAY_UNDERLINE = "\x1b[4;90m",
    GRAY_REVERSE = "\x1b[7;90m"
}

enum Backgrounds {
    BLACK = "\x1b[40m",
    BLACK_BOLD = "\x1b[1;40m",
    RED = "\x1b[41m",
    RED_BOLD = "\x1b[1;41m",
    GREEN = "\x1b[42m",
    GREEN_BOLD = "\x1b[1;42m",
    YELLOW = "\x1b[43m",
    YELLOW_BOLD = "\x1b[1;43m",
    BLUE = "\x1b[44m",
    BLUE_BOLD = "\x1b[1;44m",
    PURPLE = "\x1b[45m",
    PURPLE_BOLD = "\x1b[1;45m",
    CYAN = "\x1b[46m",
    CYAN_BOLD = "\x1b[1;46m",
    WHITE = "\x1b[47m",
    WHITE_BOLD = "\x1b[1;47m",
    GRAY = "\x1b[100m",
    GRAY_BOLD = "\x1b[1;100m",
}

enum Styles {
    BOLD = '\x1b[1m',
    UNDERLINE = '\x1b[4m',
    REVERSE = '\x1b[7m',
    RESET = '\x1b[0m'
}

export function print(text: string, style: Colors | Styles | Backgrounds) {
    return style + text + Styles.RESET
}

export const colors = {
    purple: Object.assign((text: string) => print(text, Colors.PURPLE), {
        bold: (text: string) => print(text, Colors.PURPLE_BOLD),
        underline: (text: string) => print(text, Colors.PURPLE_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.PURPLE_REVERSE)
    }),
    green: Object.assign((text: string) => print(text, Colors.GREEN), {
        bold: (text: string) => print(text, Colors.GREEN_BOLD),
        underline: (text: string) => print(text, Colors.GREEN_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.GREEN_REVERSE)
    }),
    blue: Object.assign((text: string) => print(text, Colors.BLUE), {
        bold: (text: string) => print(text, Colors.BLUE_BOLD),
        underline: (text: string) => print(text, Colors.BLUE_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.BLUE_REVERSE)
    }),
    cyan: Object.assign((text: string) => print(text, Colors.CYAN), {
        bold: (text: string) => print(text, Colors.CYAN_BOLD),
        underline: (text: string) => print(text, Colors.CYAN_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.CYAN_REVERSE)
    }),
    yellow: Object.assign((text: string) => print(text, Colors.YELLOW), {
        bold: (text: string) => print(text, Colors.YELLOW_BOLD),
        underline: (text: string) => print(text, Colors.YELLOW_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.YELLOW_REVERSE)
    }),
    black: Object.assign((text: string) => print(text, Colors.BLACK), {
        bold: (text: string) => print(text, Colors.BLACK_BOLD),
        underline: (text: string) => print(text, Colors.BLACK_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.BLACK_REVERSE)
    }),
    red: Object.assign((text: string) => print(text, Colors.RED), {
        bold: (text: string) => print(text, Colors.RED_BOLD),
        underline: (text: string) => print(text, Colors.RED_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.RED_REVERSE)
    }),
    white: Object.assign((text: string) => print(text, Colors.WHITE), {
        bold: (text: string) => print(text, Colors.WHITE_BOLD),
        underline: (text: string) => print(text, Colors.WHITE_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.WHITE_REVERSE)
    }),
    gray: Object.assign((text: string) => print(text, Colors.GRAY), {
        bold: (text: string) => print(text, Colors.GRAY_BOLD),
        underline: (text: string) => print(text, Colors.GRAY_UNDERLINE), 
        reverse:(text: string) => print(text, Colors.GRAY_REVERSE)
    }),
}

export const backgrounds = {
    purple: Object.assign((text: string) => print(text, Backgrounds.PURPLE), {
        bold: (text: string) => print(text, Backgrounds.PURPLE_BOLD)
    }),
    green: Object.assign((text: string) => print(text, Backgrounds.GREEN), {
        bold: (text: string) => print(text, Backgrounds.GREEN_BOLD)
    }),
    yellow: Object.assign((text: string) => print(text, Backgrounds.YELLOW), {
        bold: (text: string) => print(text, Backgrounds.YELLOW_BOLD),
    }),
    blue: Object.assign((text: string) => print(text, Backgrounds.BLUE), {
        bold: (text: string) => print(text, Backgrounds.BLUE_BOLD)
    }),
    cyan: Object.assign((text: string) => print(text, Backgrounds.CYAN), {
        bold: (text: string) => print(text, Backgrounds.CYAN_BOLD)
    }),
    black: Object.assign((text: string) => print(text, Backgrounds.BLACK), {
        bold: (text: string) => print(text, Backgrounds.BLACK_BOLD)
    }),
    red: Object.assign((text: string) => print(text, Backgrounds.RED), {
        bold: (text: string) => print(text, Backgrounds.RED_BOLD),
    }),
    white: Object.assign((text: string) => print(text, Backgrounds.WHITE), {
        bold: (text: string) => print(text, Backgrounds.WHITE_BOLD)
    }),
    gray: Object.assign((text: string) => print(text, Backgrounds.GRAY), {
        bold: (text: string) => print(text, Backgrounds.GRAY_BOLD)
    })
}

export const styles = {
    bold: (text: string) => print(text, Styles.BOLD),
    underline: (text: string) => print(text, Styles.UNDERLINE),
    reverse: (text: string) => print(text, Styles.RESET)
}

export const msg = {
    prefix: `[${colors.purple('DynamoDBLocal')}] `,
    error(name: string, message: string) {
        return this.prefix + colors.red.bold(`${name.toUpperCase()}: `) + message
    },
    warning(message: string) {
        return this.prefix + colors.yellow.bold('WARNING: ') + message
    },
    message(message: string) {
        return this.prefix + message
    },
    info(message: string) {
        return this.prefix + styles.bold(message)
    },
    success(message: string) {
        return this.prefix + colors.green.bold(message.toUpperCase())
    },
    fail (message: string) {
        return this.prefix + colors.red.bold(message.toUpperCase())
    }
}

export const log = {
    error(name: string, message: string) {
        console.log(msg.error(name, message))
    },
    warning(message: string) {
        console.log(msg.warning(message))
    },
    message(message: string) {
        console.log(msg.message(message))
    },
    info(message: string) {
        console.log(msg.info(message))
    },
    success(message: string) {
        console.log(msg.success(message))
    },
    fail (message: string) {
        console.log(msg.fail(message))
    }
}