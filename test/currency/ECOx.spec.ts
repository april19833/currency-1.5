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
  ECOx__factory,
  ECO__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

const INITIAL_SUPPLY = '1' + '000'.repeat(7) // 1000 eco initially

describe('EcoX', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let dave: SignerWithAddress // distributer
  let policyImpersonater: SignerWithAddress
  before(async () => {
    ;[alice, bob, charlie, dave, policyImpersonater] = await ethers.getSigners()
  })
  let eco: MockContract<ECO>

  let EcoXImpl: ECOx
  let EcoXProxy: ECOx
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
      Fake__Policy.address, // distributor
      1000, // initial supply
      Fake__Policy.address // initial pauser
    )

    const EcoXFact = new ECOx__factory(alice)

    EcoXImpl = await EcoXFact.connect(policyImpersonater).deploy(
      Fake__Policy.address, // policy
      Fake__Policy.address, // ecoxstaking
      Fake__Policy.address, // ecoxexchange
      dave.address, // distributor
      INITIAL_SUPPLY,
      eco.address,
      bob.address // pauser
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(EcoXImpl.address)

    EcoXProxy = EcoXFact.attach(proxy.address)

    expect(EcoXProxy.address === proxy.address).to.be.true
  })

  describe('role permissions', () => {
    describe('minter role', () => {
      it('can be added by the policy', async () => {
        await EcoXProxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          true
        )
        const charlieMinting = await EcoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await EcoXProxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          true
        )
        await EcoXProxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          false
        )
        const charlieMinting = await EcoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await EcoXProxy.connect(policyImpersonater).updateMinters(
            charlie.address,
            true
          )
        )
          .to.emit(EcoXProxy, 'UpdatedMinters')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          EcoXProxy.connect(charlie).updateMinters(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('burner role', () => {
      it('can be added by the policy', async () => {
        await EcoXProxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          true
        )
        const charlieBurning = await EcoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.true
      })

      it('can be removed by the policy', async () => {
        await EcoXProxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          true
        )
        await EcoXProxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          false
        )
        const charlieBurning = await EcoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await EcoXProxy.connect(policyImpersonater).updateBurners(
            charlie.address,
            true
          )
        )
          .to.emit(EcoXProxy, 'UpdatedBurners')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          EcoXProxy.connect(charlie).updateBurners(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('ECOxStaking role', () => {
      it('is onlyPolicy gated', async () => {
        await expect(
          EcoXProxy.connect(charlie).updateECOxStaking(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
      it('swaps out the addresses if called by policy', async () => {
        const oldStaking = await EcoXProxy.ecoXStaking()
        expect(oldStaking).to.not.eq(charlie.address)

        await expect(
          EcoXProxy.connect(policyImpersonater).updateECOxStaking(
            charlie.address
          )
        )
          .to.emit(EcoXProxy, 'UpdatedECOxStaking')
          .withArgs(oldStaking, charlie.address)

        expect(await EcoXProxy.ecoXStaking()).to.eq(charlie.address)
      })
    })

    describe('ECOxExchange role', () => {
      it('is onlyPolicy gated', async () => {
        await expect(
          EcoXProxy.connect(charlie).updateECOxExchange(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
      it('swaps out the addresses if called by policy', async () => {
        const oldExchange = await EcoXProxy.ecoXExchange()
        expect(oldExchange).to.not.eq(charlie.address)

        await expect(
          EcoXProxy.connect(policyImpersonater).updateECOxExchange(
            charlie.address
          )
        )
          .to.emit(EcoXProxy, 'UpdatedECOxExchange')
          .withArgs(oldExchange, charlie.address)

        expect(await EcoXProxy.ecoXExchange()).to.eq(charlie.address)
      })
    })
  })
})
