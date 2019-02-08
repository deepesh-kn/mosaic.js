const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('EIP20Gateway.getLatestAnchorInfo()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockAnchorContract;
  let getAnchorResult;
  let getLatestStateRootBlockHeightResult;
  let getStateRootResult;

  let spyGetAnchor;
  let spyGetLatestStateRootBlockHeight;
  let spyGetStateRootResult;
  let spyCall;

  const setup = () => {
    mockAnchorContract = sinon.mock(
      new Anchor(web3, '0x0000000000000000000000000000000000000020'),
    );
    getAnchorResult = mockAnchorContract.object;
    getLatestStateRootBlockHeightResult = '12345';
    getStateRootResult =
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    spyGetAnchor = sinon.replace(
      gateway,
      'getAnchor',
      sinon.fake.resolves(getAnchorResult),
    );
    spyGetLatestStateRootBlockHeight = sinon.replace(
      mockAnchorContract.object,
      'getLatestStateRootBlockHeight',
      sinon.fake.resolves(getLatestStateRootBlockHeightResult),
    );
    spyGetStateRootResult = sinon.replace(
      mockAnchorContract.object,
      'getStateRoot',
      sinon.fake.resolves(getStateRootResult),
    );
    spyCall = sinon.spy(gateway, 'getLatestAnchorInfo');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
    mockAnchorContract.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
  });

  it('should return anchor object', async () => {
    setup();
    const result = await gateway.getLatestAnchorInfo();
    assert.strictEqual(
      result.blockHeight,
      getLatestStateRootBlockHeightResult,
      'Result.blockHeight of getLatestAnchorInfo must be equal to mocked block height',
    );
    assert.strictEqual(
      result.stateRoot,
      getStateRootResult,
      'Result.stateRoot of getLatestAnchorInfo must be equal to mocked state root height',
    );

    SpyAssert.assert(spyCall, 1, [[]]);
    SpyAssert.assert(spyGetAnchor, 1, [[]]);
    SpyAssert.assert(spyGetLatestStateRootBlockHeight, 1, [[]]);
    SpyAssert.assert(spyGetStateRootResult, 1, [
      [getLatestStateRootBlockHeightResult],
    ]);

    tearDown();
  });
});