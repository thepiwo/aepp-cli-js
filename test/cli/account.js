/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import fs from 'fs'
import { before, describe, it } from 'mocha'

import { configure, plan, ready, execute, BaseAe, KEY_PAIR, WALLET_NAME } from './index'
import { generateKeyPair } from '@aeternity/aepp-sdk/es/utils/crypto'

const walletName = 'test.wallet'

plan(1000000000)

describe('CLI Account Module', function () {
  configure(this)

  let wallet

  before(async function () {
    // Spend tokens for wallet
    wallet = await ready(this)
  })
  after(function () {
    // Remove wallet files
    if (fs.existsSync(walletName)) { fs.unlinkSync(walletName) }
    if (fs.existsSync(`${walletName}.pub`)) { fs.unlinkSync(`${walletName}.pub`) }
  })

  it('Create Wallet', async () => {
    // create wallet
    await execute(['account', 'create', walletName, '--password', 'test', '--overwrite'])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)
    // fs.existsSync(walletName).should.equal(true)

    // check if wallet files valid
    JSON.parse(await execute(['account', 'address', walletName, '--password', 'test', '--json'])).publicKey.should.be.a('string')
  })
  it('Create Wallet From Private Key', async () => {
    // create wallet
    await execute(['account', 'save', walletName, '--password', 'test', KEY_PAIR.secretKey, '--overwrite'])

    // check for wallet files
    fs.existsSync(walletName).should.equal(true)

    // check if wallet valid
    JSON.parse(await execute(['account', 'address', walletName, '--password', 'test', '--json'])).publicKey.should.equal(KEY_PAIR.publicKey)
  })
  it('Check Wallet Address', async () => {
    // check if wallet valid
    JSON.parse(await execute(['account', 'address', WALLET_NAME, '--password', 'test', '--json'])).publicKey.should.equal(KEY_PAIR.publicKey)
  })
  it('Check Wallet Address with Private Key', async () => {
    // check if wallet valid
    const { secretKey } = JSON.parse(await execute(['account', 'address', WALLET_NAME, '--password', 'test', '--privateKey', '--forcePrompt', '--json']))
    secretKey.should.equal(KEY_PAIR.secretKey)
  })
  it('Check Wallet Balance', async () => {
    try {
      const balance = await wallet.balance(await wallet.address())
      const { balance: cliBalance } = JSON.parse(await execute(['account', 'balance', WALLET_NAME, '--password', 'test', '--json'], { withOutReject: true }))
      cliBalance.should.equal(balance)
    } catch (e) {
      console.log(e)
    }
  })
  it('Spend coins to another wallet', async () => {
    const amount = 100
    const receiverKeys = generateKeyPair()
    const receiver = await BaseAe()
    await receiver.addAccount(MemoryAccount({ keypair: receiverKeys }), { select: true })

    // send coins
    await execute(['account', 'spend', WALLET_NAME, '--password', 'test', await receiver.address(), amount], { withOutReject: true, withNetworkId: true })
    const receiverBalance = await receiver.getBalance(await receiver.address())
    await parseInt(receiverBalance).should.equal(amount)
  })
  it('Spend coins to another wallet using denomination', async () => {
    const amount = 1 // 1 AE
    const denomination = AE_AMOUNT_FORMATS.AE
    const receiverKeys = generateKeyPair()
    const receiver = await BaseAe()
    // send coins
    await execute(['account', 'spend', WALLET_NAME, '--password', 'test', '-D', denomination, receiverKeys.publicKey, amount], { withOutReject: true, withNetworkId: true })
    const receiverBalance = await receiver.getBalance(receiverKeys.publicKey)
    receiverBalance.should.equal(formatAmount(amount, { denomination: AE_AMOUNT_FORMATS.AE }))
  })
  it('Get account nonce', async () => {
    const nonce = await wallet.getAccountNonce(await wallet.address())
    JSON.parse(await execute(['account', 'nonce', WALLET_NAME, '--password', 'test', '--json'], { withOutReject: true })).nextNonce.should.equal(nonce)
  })
  it('Generate accounts', async () => {
    const accounts = JSON.parse(await execute(['account', 'generate', 2, '--forcePrompt', '--json'], { withOutReject: true }))
    accounts.length.should.be.equal(2)
  })
})
