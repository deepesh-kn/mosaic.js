'use strict';

const BN = require('bn.js');
const Web3 = require('web3');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');

/**
 * Contract interact for OSTPrime contract.
 */
class OSTPrime {
  /**
   * Constructor for OSTPrime.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} contractAddress OSTPrime contract address.
   */
  constructor(web3, contractAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(contractAddress)) {
      throw new TypeError(
        "Mandatory Parameter 'contractAddress' is missing or invalid.",
      );
    }
    this.web3 = web3;
    this.contractAddress = contractAddress;

    this.contract = Contracts.getOSTPrime(this.web3, this.contractAddress);

    if (!this.contract) {
      throw new Error(
        `Could not load OSTPrime contract for: ${this.contractAddress}`,
      );
    }

    this.approve = this.approve.bind(this);
    this.approveRawTx = this.approveRawTx.bind(this);
    this.allowance = this.allowance.bind(this);
    this.isAmountApproved = this.isAmountApproved.bind(this);
    this.wrap = this.wrap.bind(this);
    this.wrapRawTx = this.wrapRawTx.bind(this);
    this.unwrap = this.unwrap.bind(this);
    this.unwrapRawTx = this.unwrapRawTx.bind(this);
    this.balanceOf = this.balanceOf.bind(this);
  }

  /**
   * Approves spender address for the amount transfer.
   *
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Amount to be approved.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise<boolean>} Promise that resolves to transaction receipt.
   */
  approve(spenderAddress, amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.approveRawTx(spenderAddress, amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get raw transaction object for approve amount.
   *
   * @param {string} spenderAddress Spender address.
   * @param {string} amount Approve amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to raw transaction object.
   */
  approveRawTx(spenderAddress, amount) {
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(`Invalid spender address: ${spenderAddress}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid approval amount: ${amount}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.approve(spenderAddress, amount);
    return Promise.resolve(tx);
  }

  /**
   * Returns the allowance amount for the given account address
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   *
   * @returns {Promise<string>} Promise that resolves to allowance amount.
   */
  allowance(ownerAddress, spenderAddress) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError(
        `Owner address is invalid or missing: ${ownerAddress}`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(
        `Spender address is invalid or missing: ${spenderAddress}`,
      );
      return Promise.reject(err);
    }
    return this.contract.methods
      .allowance(ownerAddress, spenderAddress)
      .call();
  }

  /**
   * Check if the account has approved spender account for a given amount.
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` when it's
   *                             approved otherwise false.
   */
  isAmountApproved(ownerAddress, spenderAddress, amount) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError(`Invalid owner address: ${ownerAddress}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(`Invalid spender address: ${spenderAddress}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.allowance(ownerAddress, spenderAddress).then(
      (approvedAllowance) => {
        return new BN(amount).lte(new BN(approvedAllowance));
      },
    );
  }

  /**
   * Returns the balance of an account.
   *
   * @param {string} accountAddress Account address
   * @returns {Promise<string>} Promise that resolves to balance amount.
   */
  balanceOf(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      const err = new TypeError(`Invalid address: ${accountAddress}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.balanceOf(accountAddress).call();
  }

  /**
   * Unwrap amount.
   *
   * @param {string} amount Amount to unwrap.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  unwrap(amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.unwrapRawTx(amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Unwrap amount raw transaction.
   *
   * @param {string} amount Amount to unwrap.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  unwrapRawTx(amount) {
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid amount: ${amount}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.unwrap(amount);
    return Promise.resolve(tx);
  }

  /**
   * Wrap amount.
   *
   * @param {Object} txOptions Transaction options.
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  wrap(txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (new BN(txOptions.value).lten(0)) {
      const err = new TypeError(
        `Transaction value amount must not be zero: ${txOptions.value}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.wrapRawTx().then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Wrap amount raw transaction.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  wrapRawTx() {
    const tx = this.contract.methods.wrap();
    return Promise.resolve(tx);
  }
}

module.exports = OSTPrime;
