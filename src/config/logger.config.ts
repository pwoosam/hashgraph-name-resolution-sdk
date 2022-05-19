/* eslint-disable import/prefer-default-export */
import { configure, getLogger } from 'log4js';

const isProduction = process.env.ENVIRONMENT === 'production';

const appendersArr: string[] = ['console'];
if (isProduction) appendersArr.push('dateFile');

configure({
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

export const logger = getLogger();
