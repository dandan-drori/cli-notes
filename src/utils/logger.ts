import {Colors} from "../colors";

export class Logger {
    constructor() {
    }

    error(msg: string) {
        console.log(`${Colors.Red}Error:${Colors.Reset} ${msg}`);
    }

    success(msg: string) {
        console.log(`${Colors.Green}Done:${Colors.Reset} ${msg}`);
    }

    info(msg: string) {
        console.log(msg);
    }
}