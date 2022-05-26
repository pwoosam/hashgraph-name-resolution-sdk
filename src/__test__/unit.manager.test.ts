import { getManagerInfo } from '../manager';
import { MANAGER_ID, MANAGER_ABI } from '../config/constants.config';

describe('test', () => {
  test('should do something', () => {
    const output = getManagerInfo();

    expect(output.contract.id.toString()).toEqual(MANAGER_ID);
    expect(output.abi).toEqual(MANAGER_ABI);
  });
});
