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
  ECOxStaking,
} from '../../typechain-types'

const INITIAL_SUPPLY = '1' + '000'.repeat(7) // 1000 ECOx initially
const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

describe('ECOxExchange', () => {
  let alice: SignerWithAddress // default signer
  let charlie: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[alice, charlie, policyImpersonator] = await ethers.getSigners()
  })
  let eco: MockContract<ECO>
  let ECOx: MockContract<ECOx>

  let ecoXExchange: ECOxExchange

  let Fake__Policy: FakeContract<Policy>
  let ecoXStaking: FakeContract<ECOxStaking>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )
    ecoXStaking = await smock.fake<ECOxStaking>(
      'ECOxStaking',
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      Fake__Policy.address,
      Fake__Policy.address, // distributor
      INITIAL_SUPPLY, // initial supply
      Fake__Policy.address // initial pauser
    )
    const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
      'ECOx'
    )

    ECOx = await ecoXFactory.deploy(
      Fake__Policy.address,
      ecoXStaking.address, // ECOxStaking
      PLACEHOLDER_ADDRESS1, // ECOxExchange
      Fake__Policy.address, // distributor
    )

    const exchangeFactory: ECOxExchange__factory = new ECOxExchange__factory(
      alice
    )

    ecoXExchange = await exchangeFactory
      .connect(policyImpersonator)
      .deploy(Fake__Policy.address, ECOx.address, eco.address)

    ECOx.connect(policyImpersonator).updateECOxExchange(ecoXExchange.address)
  })

  describe('role permissions', () => {
    describe('ecox role', () => {
      it('can be changed by the policy', async () => {
        await ecoXExchange
          .connect(policyImpersonator)
          .updateECOx(charlie.address)
        expect(await ecoXExchange.ECOx()).to.eq(charlie.address)
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
})
