"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/* eslint-disable import/prefer-default-export */
const log4js_1 = require("log4js");
const isProduction = process.env.ENVIRONMENT === 'production';
const appendersArr = ['console'];
if (isProduction)
    appendersArr.push('dateFile');
(0, log4js_1.configure)({
    appenders: {
        console: {
            type: 'stdout',
            layout: { type: 'colored' },
        },
        dateFile: {
            type: 'dateFile',
            filename: `${process.env.LOG_DIR}/${process.env.LOG_FILE}`,
            layout: { type: 'basic' },
            compress: true,
            numBackups: 2,
            keepFileExt: true,
        },
    },
    categories: {
        default: {
            appenders: appendersArr,
            level: process.env.LOG_LEVEL || 'debug',
            enableCallStack: true,
        },
    },
});
exports.logger = (0, log4js_1.getLogger)();
