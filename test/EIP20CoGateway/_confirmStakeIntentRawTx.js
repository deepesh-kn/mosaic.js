// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const assert = chai.assert;
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway._confirmStakeIntentRawTx()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let stakeParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'confirmStakeIntent',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, '_confirmStakeIntentRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    stakeParams = {
      staker: '0x0000000000000000000000000000000000000005',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
      blockHeight: '12345',
      storageProof: '0x123',
    };
    mockedTx = 'MockedTx';
  });

  it('should throw error when staker address is invalid', async () => {
    const expectedErrorMessage = 'Invalid staker address.';
    await coGateway
      ._confirmStakeIntentRawTx(
        undefined,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when nonce is invalid', async () => {
    const expectedErrorMessage = 'Invalid nonce.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        undefined,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when beneficiary address is invalid', async () => {
    const expectedErrorMessage = 'Invalid beneficiary address.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        undefined,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when stake amount is invalid', async () => {
    const expectedErrorMessage = 'Invalid stake amount.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas price is invalid', async () => {
    const expectedErrorMessage = 'Invalid gas price.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        undefined,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas limit is invalid', async () => {
    const expectedErrorMessage = 'Invalid gas limit.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        undefined,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when block height is invalid', async () => {
    const expectedErrorMessage = 'Invalid block height.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        undefined,
        stakeParams.storageProof,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when storage proof is invalid', async () => {
    const expectedErrorMessage = 'Invalid storage proof data.';
    await coGateway
      ._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        undefined,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway._confirmStakeIntentRawTx(
      stakeParams.staker,
      stakeParams.nonce,
      stakeParams.beneficiary,
      stakeParams.amount,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      stakeParams.blockHeight,
      stakeParams.storageProof,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);
    tearDown();
  });
});
