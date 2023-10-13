import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import {
  ECO,
  ECOx,
  ECOxExchange,
  ECOxExchange__factory,
  ECOx__factory,
  ECO__factory,
  Policy,
} from '../../typechain-types'
import { BigNumber } from 'ethers'
import { BigDecimal } from 'bigdecimal'
// import {BigNumber as BN} from 'bignumber.js'

const INITIAL_SUPPLY = (ethers.utils.parseEther('100'))

async function calcEcoValue(
  ecoXToConvert: BigNumber,
  initialEcoXSupply: BigNumber,
  currentEcoSupply: BigNumber
) {
  // console.log(Math.E) 
  const e: BigDecimal = new BigDecimal("2.718281828459045235360")
  console.log(e.toString())
  const exponent: BigDecimal = new BigDecimal(ecoXToConvert.toString()).divide(new BigDecimal(initialEcoXSupply.toString()))
  console.log(exponent)
  console.log(exponent.floatValue())
  const exponentiated: BigDecimal = e.pow()
  console.log(exponentiated.toString())
  const bdEcoSupply: BigDecimal = new BigDecimal(currentEcoSupply.toString())
  return bdEcoSupply.multiply(exponentiated.subtract(new BigDecimal("1")))
  // return currentEcoSupply.mul(
  //   new BigDecimal(Math.E).pow(ecoXToConvert.div(initialEcoXSupply)) - 1
  // )
}
// async function floorBN(numerator: BN, denominator: BN) {
//   return (numerator.sub(numerator.mod(denominator))).div(denominator)
// }
// async function decimalMultiplyBN(decimal: number, BN: BN) {
//   const bigthing = Math.floor(decimal * Number.MAX_SAFE_INTEGER)
//   return floorBN(BN.mul(bigthing), BN.from(Number.MAX_SAFE_INTEGER))
// }
// const randomInt = (min:number, max:number) => Math.floor(Math.random() * (max - min + 1)) + min;

describe('ECOxExchange', () => {
  let alice: SignerWithAddress // default signer
  let charlie: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  let pauser: SignerWithAddress
  const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
  before(async () => {
    ;[alice, charlie, policyImpersonator, pauser] = await ethers.getSigners()
  })
  let eco: MockContract<ECO>
  let ECOx: MockContract<ECOx>

  let ecoXExchange: ECOxExchange

  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      Fake__Policy.address,
      PLACEHOLDER_ADDRESS1, // distributor
      INITIAL_SUPPLY + '000', // initial supply of eco is 10x that of ecox --> 1000
      pauser.address // initial pauser
    )
    const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
      'ECOx'
    )

    ECOx = await ecoXFactory.deploy(
      Fake__Policy.address,
      PLACEHOLDER_ADDRESS1, // ECOxStaking
      PLACEHOLDER_ADDRESS1, // ECOxExchange
      pauser.address // initial pauser
    )

    const exchangeFactory: ECOxExchange__factory = new ECOxExchange__factory(
      alice
    )

    ecoXExchange = await exchangeFactory
      .connect(policyImpersonator)
      .deploy(Fake__Policy.address, ECOx.address, eco.address, INITIAL_SUPPLY)

    await ECOx.connect(policyImpersonator).updateECOxExchange(
      ecoXExchange.address
    )
    await ECOx.connect(policyImpersonator).updateMinters(
      policyImpersonator.address,
      true
    )
    await ECOx.connect(policyImpersonator).updateBurners(
      policyImpersonator.address,
      true
    )
    await ECOx.connect(policyImpersonator).mint(
      policyImpersonator.address,
      INITIAL_SUPPLY
    )

    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, true)

    await eco.connect(policyImpersonator).mint(policyImpersonator.address, INITIAL_SUPPLY+"0")
  })

  it('constructs', async () => {
    expect(await ecoXExchange.policy()).to.eq(Fake__Policy.address)
    expect(await ecoXExchange.ecox()).to.eq(ECOx.address)
    expect(await ecoXExchange.eco()).to.eq(eco.address)
    expect(await ecoXExchange.initialSupply()).to.eq(INITIAL_SUPPLY)
  })

  describe('role permissions', () => {
    describe('ecox role', () => {
      it('can be changed by the policy', async () => {
        await ecoXExchange
          .connect(policyImpersonator)
          .updateECOx(charlie.address)
        expect(await ecoXExchange.ecox()).to.eq(charlie.address)
      })

      it('emits an event', async () => {
        expect(
          await ecoXExchange
            .connect(policyImpersonator)
            .updateECOx(charlie.address)
        )
          .to.emit(ecoXExchange, 'UpdatedECOx')
          .withArgs(charlie.address)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXExchange.connect(charlie).updateECOx(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('eco role', () => {
      it('can be changed by the policy', async () => {
        await ecoXExchange
          .connect(policyImpersonator)
          .updateEco(charlie.address)
        expect(await ecoXExchange.eco()).to.eq(charlie.address)
      })

      it('emits an event', async () => {
        expect(
          await ecoXExchange
            .connect(policyImpersonator)
            .updateEco(charlie.address)
        )
          .to.emit(ecoXExchange, 'UpdatedEco')
          .withArgs(charlie.address)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXExchange.connect(charlie).updateEco(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })
  })

  describe('ecoValueOf', async () => {
    it.only('returns the correct value', async () => {
      const ecoxBalance = BigNumber.from(INITIAL_SUPPLY).div(2)
      console.log(ecoxBalance)

      await ECOx.connect(policyImpersonator).transfer(
        alice.address,
        ecoxBalance
      )
      expect(await ECOx.balanceOf(alice.address)).to.eq(ecoxBalance)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      // console.log(await eco.totalSupply())
      
      
      const calced = (await calcEcoValue(ecoxBalance, INITIAL_SUPPLY, await eco.totalSupply())).stripTrailingZeros()
      console.log(calced.toString())
      console.log(await ecoXExchange.connect(alice).ecoValueOf(ecoxBalance))
      // const divisor = 10000
      // const bigNumberCalced = BigNumber.from(calced.dividedBy(divisor).toString()).mul(divisor)
      // console.log(await ecoXExchange.connect(alice).ecoValueOf(ecoxBalance))


      expect((await ecoXExchange.connect(alice).ecoValueOf(ecoxBalance)).toString()).to.eq(calced.toString())
    })
  })
})