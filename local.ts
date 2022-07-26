require('dotenv').config()
import { HashgraphNames } from './dist/index';
const operatorId = process.env.ALICE_ID;
const privateKey = process.env.ALICE_PVKEY;

const hn = new HashgraphNames(operatorId!, privateKey!);

console.log({hn})
