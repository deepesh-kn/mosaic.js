const chai = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('Facilitator.progressStakeMessage()', () => {
  let mosaic;
  let facilitator;
  let progressStakeMessageParams;

  let performProgressStakeResult;
  let performProgressMintResult;

  let spyPerformProgressStake;
  let spyPerformProgressMint;
  let spyCall;

  const setup = () => {
    spyPerformProgressStake = sinon.replace(
      facilitator,
      'performProgressStake',
      sinon.fake.resolves(performProgressStakeResult),
    );
    spyPerformProgressMint = sinon.replace(
      facilitator,
      'performProgressMint',
      sinon.fake.resolves(performProgressMintResult),
    );
    spyCall = sinon.spy(facilitator, 'progressStakeMessage');
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressStakeMessageParams = {
      messageHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      txOptionOrigin: {
        from: '0x0000000000000000000000000000000000000001',
        gas: '7500000',
      },
      txOptionAuxiliary: {
        from: '0x0000000000000000000000000000000000000002',
        gas: '7500000',
      },
    };
    performProgressStakeResult = true;
    performProgressMintResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressStakeMessageParams.messageHash;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid message hash: ${progressStakeMessageParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressStakeMessageParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid unlock secret: ${progressStakeMessageParams.unlockSecret}.`,
    );
  });

  it('should throw an error when origin transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionOrigin;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid origin transaction option: ${
        progressStakeMessageParams.txOptionOrigin
      }.`,
    );
  });

  it('should throw an error when from address in origin transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionOrigin.from;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid from address ${
        progressStakeMessageParams.txOptionOrigin.from
      } in origin transaction options.`,
    );
  });

  it('should throw an error when auxiliary transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionAuxiliary;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid auxiliary transaction option: ${
        progressStakeMessageParams.txOptionAuxiliary
      }.`,
    );
  });

  it('should throw an error when from address in auxiliary transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionAuxiliary.from;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid from address ${
        progressStakeMessageParams.txOptionAuxiliary.from
      } in auxiliary transaction options.`,
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await facilitator.progressStakeMessage(
      progressStakeMessageParams.messageHash,
      progressStakeMessageParams.unlockSecret,
      progressStakeMessageParams.txOptionOrigin,
      progressStakeMessageParams.txOptionAuxiliary,
    );

    assert.deepEqual(
      result,
      [true, true],
      'Result of progressStakeMessage must be [true, true]',
    );

    SpyAssert.assert(spyPerformProgressStake, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
      ],
    ]);
    SpyAssert.assert(spyPerformProgressMint, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ],
    ]);
    teardown();
  });
});