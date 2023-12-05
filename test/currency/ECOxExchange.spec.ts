import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
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
import { BigDecimal, RoundingMode } from 'bigdecimal'
import { deploy } from '../../deploy/utils'

const INITIAL_SUPPLY = ethers.utils.parseEther('100')

async function calcEcoValue(
  ecoXToConvert: BigNumber,
  initialEcoXSupply: BigNumber,
  currentEcoSupply: BigNumber
) {
  const exponent: BigDecimal = new BigDecimal(ecoXToConvert.toString()).divide(
    new BigDecimal(initialEcoXSupply.toString())
  )
  /**
   * Math.E is imprecise here, it has been accounted for in tests by using chai's closeTo with a tolerance rather than eq
   */
  const exponentiated = new BigDecimal(
    (Math.E ** exponent.floatValue()).toString()
  )
  const bdEcoSupply: BigDecimal = new BigDecimal(currentEcoSupply.toString())
  const unrounded = bdEcoSupply.multiply(
    exponentiated.subtract(new BigDecimal('1'))
  )
  return unrounded.setScale(0, RoundingMode.HALF_UP())
}

describe('ECOxExchange', () => {
  let alice: SignerWithAddress // default signer
  let policyImpersonator: SignerWithAddress
  let pauser: SignerWithAddress

  before(async () => {
    ;[alice, policyImpersonator, pauser] = await ethers.getSigners()
  })
  let eco: MockContract<ECO>
  let ECOx: MockContract<ECOx>

  let ecoXExchange: ECOxExchange

  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to make calls from the address
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      Fake__Policy.address,
      pauser.address // initial pauser
    )
    const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
      'ECOx'
    )

    ECOx = await ecoXFactory.deploy(
      Fake__Policy.address,
      pauser.address // initial pauser
    )

    ecoXExchange = (await deploy(policyImpersonator, ECOxExchange__factory, [
      Fake__Policy.address,
      ECOx.address,
      eco.address,
      INITIAL_SUPPLY,
    ])) as ECOxExchange

    await ECOx.connect(policyImpersonator).updateECOxExchange(
      ecoXExchange.address
    )
    await ECOx.connect(policyImpersonator).updateMinters(
      policyImpersonator.address,
      true
    )
    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, true)
    await ECOx.connect(policyImpersonator).updateBurners(
      policyImpersonator.address,
      true
    )
    await ECOx.connect(policyImpersonator).updateBurners(
      ecoXExchange.address,
      true
    )
    await ECOx.connect(policyImpersonator).mint(
      policyImpersonator.address,
      INITIAL_SUPPLY
    )
    await eco
      .connect(policyImpersonator)
      .mint(policyImpersonator.address, INITIAL_SUPPLY.mul(10))

    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, true)

    await eco
      .connect(policyImpersonator)
      .updateMinters(ecoXExchange.address, true)

    await eco
      .connect(policyImpersonator)
      .mint(policyImpersonator.address, INITIAL_SUPPLY + '0')
  })

  it('constructs', async () => {
    expect(await ecoXExchange.policy()).to.eq(Fake__Policy.address)
    expect(await ecoXExchange.ecox()).to.eq(ECOx.address)
    expect(await ecoXExchange.eco()).to.eq(eco.address)
    expect(await ecoXExchange.initialSupply()).to.eq(INITIAL_SUPPLY)
  })

  describe('ecoValueOf', async () => {
    it('returns the correct value with low proportion', async () => {
      const ecoxBalance = INITIAL_SUPPLY.div(1234567)

      const calced = await calcEcoValue(
        ecoxBalance,
        INITIAL_SUPPLY,
        await eco.totalSupply()
      )

      /**
       * math libraries are a nightmare, the E constant wasnt precise enough in base form and if i made a more precise
       * version as a BigDecimal i wasnt able to do the necessary decimal exponentiation so ive just added a tolerance
       * to account for the imprecision
       */
      expect(await ecoXExchange.ecoValueOf(ecoxBalance)).to.be.closeTo(
        BigNumber.from(calced.toPlainString()),
        BigNumber.from('1000000')
      )
    })

    it('returns the correct value with high proportion', async () => {
      const ecoxBalance = INITIAL_SUPPLY.div(2)

      const calced = await calcEcoValue(
        ecoxBalance,
        INITIAL_SUPPLY,
        await eco.totalSupply()
      )

      expect(await ecoXExchange.ecoValueOf(ecoxBalance)).to.be.closeTo(
        BigNumber.from(calced.toPlainString()),
        BigNumber.from('1000000')
      )
    })
  })
  describe('valueAt', async () => {
    it('returns the correct value', async () => {
      const otherEcoSupply = BigNumber.from('1012345678901234567890')
      const ecoxBalance = INITIAL_SUPPLY.div(5)
      eco.totalSupplySnapshot.returns(otherEcoSupply)
      const calced = (
        await calcEcoValue(ecoxBalance, INITIAL_SUPPLY, otherEcoSupply)
      ).stripTrailingZeros()

      expect(await ecoXExchange.valueAt(ecoxBalance.toString())).to.be.closeTo(
        BigNumber.from(calced.toPlainString()),
        BigNumber.from('1000000')
      )
    })
  })

  describe('exchange', async () => {
    it('works', async () => {
      const ecoxBalance = INITIAL_SUPPLY.div(5)
      const remainder = INITIAL_SUPPLY.sub(ecoxBalance)

      await ECOx.connect(policyImpersonator).transfer(
        alice.address,
        INITIAL_SUPPLY
      )
      expect(await ECOx.balanceOf(alice.address)).to.eq(INITIAL_SUPPLY)
      expect(await eco.balanceOf(alice.address)).to.eq(0)

      const calced = await calcEcoValue(
        ecoxBalance,
        INITIAL_SUPPLY,
        await eco.totalSupply()
      )

      await ecoXExchange.connect(alice).exchange(ecoxBalance)

      expect(await ECOx.balanceOf(alice.address)).to.eq(remainder)
      expect(await eco.balanceOf(alice.address)).to.be.closeTo(
        BigNumber.from(calced.toPlainString()),
        BigNumber.from('1000000')
      )
    })
  })
})
