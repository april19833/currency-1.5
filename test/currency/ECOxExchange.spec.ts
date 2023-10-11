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
import { BigNumber, Signer } from 'ethers'

const INITIAL_SUPPLY = ethers.utils.parseEther('100')

async function calcEcoValue(ecoXToConvert: string, initialEcoXSupply: string, currentEcoXSupply: string) {
  return 
}

describe('ECOxExchange', () => {
  let alice: SignerWithAddress // default signer
  let charlie: SignerWithAddress
  let policyImpersonater: SignerWithAddress
  let pauser: SignerWithAddress
  const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
  before(async () => {
    ;[alice, charlie, policyImpersonater, pauser] = await ethers.getSigners()
  })
  let eco: MockContract<ECO>
  let ECOx: MockContract<ECOx>

  let ecoXExchange: ECOxExchange

  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      Fake__Policy.address,
      PLACEHOLDER_ADDRESS1, // distributor
      INITIAL_SUPPLY.mul(10), // initial supply of eco is 10x that of ecox --> 1000
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
      .connect(policyImpersonater)
      .deploy(Fake__Policy.address, ECOx.address, eco.address, INITIAL_SUPPLY)
    
    await ECOx.connect(policyImpersonater).updateECOxExchange(ecoXExchange.address)
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
          .connect(policyImpersonater)
          .updateECOx(charlie.address)
        expect(await ecoXExchange.ecox()).to.eq(charlie.address)
      })

      it('emits an event', async () => {
        expect(
          await ecoXExchange
            .connect(policyImpersonater)
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
          .connect(policyImpersonater)
          .updateEco(charlie.address)
        expect(await ecoXExchange.eco()).to.eq(charlie.address)
      })

      it('emits an event', async () => {
        expect(
          await ecoXExchange
            .connect(policyImpersonater)
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
    it('returns the correct value')
  })
})
