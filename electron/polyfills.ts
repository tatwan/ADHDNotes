import { File } from 'node:buffer';

if (!global.File) {
    // @ts-ignore
    global.File = File;
}

if (!global.FormData) {
    const { FormData } = require('undici');
    global.FormData = FormData;
}
