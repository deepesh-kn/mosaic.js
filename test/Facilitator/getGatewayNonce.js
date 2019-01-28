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
const sinon = require('sinon');
const Web3 = require('web3');
const Facilitator = require('../../libs/Facilitator/Facilitator');

const assert = chai.assert;

describe('Facilitator.getGatewayNonce()', () => {
  let facilitator;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9546'));
    gatewayAddress = '0x52c50cC9bBa156C65756abd71b172B6408Dde006';
    coGatewayAddress = '0xbF03E1680258c70B86D38A7e510F559A6440D06e';
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress
    );
  });

  it('should throw error when account address is not string', async function() {
    this.timeout(5000);

    const accountAddress = 0x79376dc1925ba1e0276473244802287394216a39;
    const expectedErrorMessage = 'Invalid account address.';
    // Call getGatewayNonce.
    await facilitator.getGatewayNonce(accountAddress).catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`
      );
    });

    // Call with undefined account address.
    await facilitator.getGatewayNonce().catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`
      );
    });
  });

  it('should return correct nonce value', async function() {
    this.timeout(5000);

    const accountAddress = '0x79376dc1925ba1e0276473244802287394216a39';

    // Mock an instance of gateway contract.
    const mockGatewayContract = sinon.mock(
      facilitator.contracts.Gateway(this.gatewayAddress)
    );
    const gatewayContract = mockGatewayContract.object;

    // Fake the getNonce call.
    sinon.stub(gatewayContract.methods, 'getNonce').callsFake(() => {
      return function() {
        return Promise.resolve(1);
      };
    });

    // Fake the Gateway call to return gatewayContract object;
    sinon.stub(facilitator.contracts, 'Gateway').callsFake(() => {
      return gatewayContract;
    });

    // Add spy on Facilitator.getGatewayNonce.
    const spy = sinon.spy(facilitator, 'getGatewayNonce');

    // Call getGatewayNonce.
    const nonce = await facilitator.getGatewayNonce(accountAddress);

    // Assert the returned value.
    assert.strictEqual(nonce, 1, 'Nonce must be equal.');

    // Assert if the function was called with correct argument.
    assert.strictEqual(
      spy.calledWith(accountAddress),
      true,
      'Function not called with correct argument.'
    );

    // Assert if the function was called only once.
    assert.strictEqual(
      spy.withArgs(accountAddress).calledOnce,
      true,
      'Function must be called once'
    );

    // Restore all mocked and spy objects.
    mockGatewayContract.restore();
    spy.restore();
  });
});
