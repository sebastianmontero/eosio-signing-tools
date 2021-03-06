const fetch = require('node-fetch')
const ecc = require('eosjs-ecc')
const ChainNodeMap = require('./ChainNodeMap')

class SigningTools {
  /**
  * @param {string} chainId
  * @param {string} account
  * @returns {Object} with account info
  */
  static async getAccountInfo (chainId, account) {
    const node = ChainNodeMap[chainId]
    if (!node) {
      throw new Error(`No node found for chainId: ${chainId}`)
    }
    const {
      host,
      port
    } = node
    const accountInfo = await fetch(`https://${host}:${port}/v1/chain/get_account`, {
      method: 'post',
      body: JSON.stringify({ account_name: account }),
      headers: { 'Content-Type': 'application/json' }
    })
    return accountInfo.json()
  }

  /**
  * @param {string} chainId
  * @param {string} account
  * @returns {Array} with accounts public keys
  */
  static async getPublicKeys (chainId, account) {
    const { permissions } = await this.getAccountInfo(chainId, account)
    const pubKeys = []
    if (permissions) {
      permissions.forEach(({ required_auth: { keys } }) => {
        keys.forEach(({ key }) => pubKeys.push(key))
      })
    }
    return pubKeys
  }

  /**
  * @param {string} chainId
  * @param {string} account
  * @param {string} signature
  * @param {string} data
  * @returns {boolean} whether verfication was succesful
  */
  static async verifySignature ({
    chainId,
    account,
    signature,
    data
  }) {
    const pubKeys = await this.getPublicKeys(chainId, account)
    for (const pubKey of pubKeys) {
      if (ecc.verify(signature, data, pubKey)) {
        return true
      }
    }
    return false
  }
}

module.exports = SigningTools
