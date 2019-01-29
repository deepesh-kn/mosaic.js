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

const BN = require('bn.js');
const chai = require('chai');
const sinon = require('sinon');
const Web3 = require('web3');
const Facilitator = require('../../libs/Facilitator/Facilitator');

const assert = chai.assert;

describe('Facilitator.stake()', () => {
  let facilitator;
  let originWeb3;
  let auxiliaryWeb3;
  let gatewayAddress;
  let coGatewayAddress;
  let stakeParams = {};

  let valueTokenAddress;
  let baseTokenAddress;
  let bountyAmount;
  let stakerNonce;
  let hashLockObj;

  let mockTx;
  let mockGatewayContract;
  let spyStakeCall;
  let spyStake;
  let spyGetBaseToken;
  let spyGetGatewayNonce;
  let spyGetHashLock;
  let spyGetBounty;
  let spyApproveStakeAmount;
  let spyApproveBountyAmount;
  let spySend;
  let spyGateway;
  let spyGetValueToken;

  const setup = function() {
    // Mock facilitator.getValueToken method to return expected value token address.
    spyGetValueToken = sinon.replace(
      facilitator,
      'getValueToken',
      sinon.fake.returns(valueTokenAddress)
    );

    // Mock facilitator.getBaseToken method to return expected base token address.
    spyGetBaseToken = sinon.replace(
      facilitator,
      'getBaseToken',
      sinon.fake.returns(baseTokenAddress)
    );

    // Mock facilitator.getGatewayNonce method to return expected nonce from gateway.
    spyGetGatewayNonce = sinon.replace(
      facilitator,
      'getGatewayNonce',
      sinon.fake.returns(stakerNonce)
    );

    // Mock facilitator.getHashLock method to return expected nonce from gateway.
    spyGetHashLock = sinon.replace(
      facilitator,
      'getHashLock',
      sinon.fake.returns(hashLockObj)
    );

    // Mock facilitator.getBounty method to return expected bounty amount
    spyGetBounty = sinon.replace(
      facilitator,
      'getBounty',
      sinon.fake.returns(bountyAmount)
    );

    // Mock facilitator.approveStakeAmount method to return expected bounty amount
    spyApproveStakeAmount = sinon.replace(
      facilitator,
      'approveStakeAmount',
      sinon.fake.returns(true)
    );

    // Mock facilitator.approveBountyAmount method to return expected bounty amount
    spyApproveBountyAmount = sinon.replace(
      facilitator,
      'approveBountyAmount',
      sinon.fake.returns(true)
    );

    // Mock an instance of gateway contract.
    mockGatewayContract = sinon.mock(
      facilitator.contracts.Gateway(gatewayAddress)
    );

    const gatewayContract = mockGatewayContract.object;

    // Mock approve transaction object.
    mockTx = sinon.mock(
      gatewayContract.methods.stake(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      )
    );

    // Mock stake call.
    spyStake = sinon.replace(
      gatewayContract.methods,
      'stake',
      sinon.fake.returns(mockTx.object)
    );

    // Mock send call.
    spySend = sinon.replace(mockTx.object, 'send', sinon.fake.resolves(true));

    spyGateway = sinon.replace(
      facilitator.contracts,
      'Gateway',
      sinon.fake.returns(gatewayContract)
    );

    sinon.stub(facilitator, 'sendTransaction').callsFake((tx, txOptions) => {
      return new Promise(async function(resolve, reject) {
        const sendResult = await tx.send();
        resolve({ txResult: sendResult, txOptions: txOptions });
      });
    });

    spyStakeCall = sinon.spy(facilitator, 'stake');
  };

  const tearDown = function() {
    mockTx.restore();
    mockGatewayContract.restore();
    sinon.restore();
    spyStakeCall.restore();
  };

  const assertSpy = function(spy, callCount, args) {
    assert.strictEqual(
      spy.callCount,
      callCount,
      'Call count must match with the expected value.'
    );

    if (args) {
      for (let i = 0; i < callCount; i += 1) {
        const expectedArguments = args[i];
        const actualArguments = spy.args[i];
        for (let params = 0; params < actualArguments.length; params += 1) {
          assert.strictEqual(
            actualArguments[params],
            expectedArguments[params],
            'Input params must match with the expected value.'
          );
        }
      }
    }
  };

  beforeEach(() => {
    originWeb3 = new Web3(
      new Web3.providers.HttpProvider('http://127.0.0.1:9546')
    );
    auxiliaryWeb3 = new Web3(
      new Web3.providers.HttpProvider('http://127.0.0.1:8546')
    );
    gatewayAddress = '0x52c50cC9bBa156C65756abd71b172B6408Dde006';
    coGatewayAddress = '0xbF03E1680258c70B86D38A7e510F559A6440D06e';
    facilitator = new Facilitator(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress
    );
    stakeParams = {
      staker: '0xe98bcba71ccf41ad7f41dc58257638614b7815fe',
      amount: '1000000000000',
      beneficiary: '0x223c893a5165db9c62e782a250b60251b81b43c4',
      gasPrice: '1',
      gasLimit: '1000000',
      unlockSecret: 'secret',
      facilitator: '0x3bd282c198197b8a819622529e63548737a90b84',
      gas: '80000000'
    };
    valueTokenAddress = '0x79376dc1925ba1e0276473244802287394216a39';
    baseTokenAddress = '0x4e4ea3140f3d4a07e2f054cbabfd1f8038b3b4b0';

    hashLockObj = {
      secret: 'secret',
      unlockSecret: '0x736563726574',
      hashLock:
        '0x65462b0520ef7d3df61b9992ed3bea0c56ead753be7c8b3614e0ce01e4cac41b'
    };

    bountyAmount = '100';
    stakerNonce = '1';
  });

  it('should throw error when staker address is invalid', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid staker address.';
    await facilitator
      .stake(
        '0x123',
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`
        );
      });
  });

  it('should throw error when beneficiary address is invalid', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid beneficiary address.';
    await facilitator
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        '0x123',
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`
        );
      });
  });

  it('should throw error when stake amount is zero', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Stake amount must not be zero.';
    await facilitator
      .stake(
        stakeParams.staker,
        '0',
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`
        );
      });
  });

  it('should pass when gas price is undefined', async function() {
    this.timeout(5000);
    stakeParams.gasPrice = 0;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      undefined,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        '0',
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 1, [
      [stakeParams.facilitator, bountyAmount]
    ]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when gas limit is undefined', async function() {
    this.timeout(5000);
    stakeParams.gasLimit = '0';
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      undefined,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        '0',
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 1, [
      [stakeParams.facilitator, bountyAmount]
    ]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when without unlock secret', async function() {
    this.timeout(5000);
    delete stakeParams.unlockSecret;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        undefined,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 1, [
      [stakeParams.facilitator, bountyAmount]
    ]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when facilitator address is not provided', async function() {
    this.timeout(5000);
    delete stakeParams.facilitator;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      undefined,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.staker,
      'From address of transaction option must be staker address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        undefined,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 1, [[stakeParams.staker, bountyAmount]]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when all the function arguments are provided', async function() {
    this.timeout(5000);
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 1, [
      [stakeParams.facilitator, bountyAmount]
    ]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when gas is not provided in the function argument', async function() {
    this.timeout(5000);
    delete stakeParams.gas;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      undefined
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      '7000000',
      `Gas provided in the transaction option must be 7000000`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        undefined
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, '7000000']
    ]);
    assertSpy(spyApproveBountyAmount, 1, [
      [stakeParams.facilitator, bountyAmount]
    ]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when base token and value token is same and staker is facilitator', async function() {
    this.timeout(5000);
    stakeParams.facilitator = stakeParams.staker;
    baseTokenAddress = valueTokenAddress;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 1, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    const totalAmount = new BN(stakeParams.amount).add(new BN(bountyAmount));
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, totalAmount.toString(10), stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 0, [[]]);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });

  it('should pass when bounty amount is zero', async function() {
    this.timeout(5000);
    bountyAmount = '0';
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      stakeParams.facilitator,
      stakeParams.gas
    );

    // Assert the result/
    assert.strictEqual(
      result.txResult,
      true,
      'Transaction result must be true.'
    );
    assert.strictEqual(
      result.txOptions.from,
      stakeParams.facilitator,
      'From address of transaction option must be facilitator address'
    );
    assert.strictEqual(
      result.txOptions.to,
      gatewayAddress,
      'To address of transaction option must be gateway contract address'
    );
    assert.strictEqual(
      result.txOptions.gas,
      stakeParams.gas,
      `Gas provided in the transaction option must be ${stakeParams.gas}`
    );

    // Assert if the mocked functions were called correctly.
    assertSpy(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        stakeParams.facilitator,
        stakeParams.gas
      ]
    ]);
    assertSpy(spyGetValueToken, 1, [[]]);
    assertSpy(spyStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock
      ]
    ]);

    assertSpy(spyGetBaseToken, 0, [[]]);
    assertSpy(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    assertSpy(spyGetHashLock, 1, [[hashLockObj.secret]]);
    assertSpy(spyGetBounty, 1, [[]]);
    assertSpy(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, stakeParams.gas]
    ]);
    assertSpy(spyApproveBountyAmount, 0);
    assertSpy(spyGateway, 1, [[gatewayAddress]]);
    assertSpy(spySend, 1, [[]]);

    tearDown();
  });
});