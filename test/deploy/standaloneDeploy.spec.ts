import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../deploy/standalone.fixture'
import { DAY } from '../utils/constants'

const INITIAL_ECO = ethers.constants.WeiPerEther.mul(10000).toString()
const INITIAL_ECOx = ethers.constants.WeiPerEther.mul(1000).toString()

const TRUSTEE_TERM = 26 * 14 * DAY
const VOTE_REWARD = 1000
const LOCKUP_DEPOSIT_WINDOW = 2 * DAY

describe('Deployment tests', () => {
  let alice: SignerWithAddress
  let trustee1: SignerWithAddress
  let trustee2: SignerWithAddress
  before(async () => {
    ;[alice, trustee1, trustee2] = await ethers.getSigners()
  })

  it('can deploy everything', async () => {
    await testnetFixture(
      [trustee1.address, trustee2.address],
      alice.address,
      INITIAL_ECO,
      INITIAL_ECOx
    )
  })

  it('check deployment tokens', async () => {
    const contracts: Fixture = await testnetFixture(
      [trustee1.address, trustee2.address],
      alice.address,
      INITIAL_ECO,
      INITIAL_ECOx
    )

    expect(await contracts.base.eco.totalSupply()).to.eq(INITIAL_ECO)
    expect(await contracts.base.eco.balanceOf(alice.address)).to.eq(INITIAL_ECO)
    expect(await contracts.base.ecox.totalSupply()).to.eq(INITIAL_ECOx)
    expect(await contracts.base.ecox.balanceOf(alice.address)).to.eq(
      INITIAL_ECOx
    )
  })

  it('check deployment constructors', async () => {
    const contracts: Fixture = await testnetFixture(
      [trustee1.address, trustee2.address],
      alice.address,
      INITIAL_ECO,
      INITIAL_ECOx
    )

    expect(await contracts.base.eco.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.eco.pauser()).to.eq(alice.address)
    expect(await contracts.base.eco.decimals()).to.eq(18)
    expect(await contracts.base.eco.name()).to.eq('ECO')
    expect(await contracts.base.eco.symbol()).to.eq('ECO')

    expect(await contracts.base.ecox.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecox.pauser()).to.eq(alice.address)
    expect(await contracts.base.ecox.decimals()).to.eq(18)
    expect(await contracts.base.ecox.name()).to.eq('ECOx')
    expect(await contracts.base.ecox.symbol()).to.eq('ECOx')

    expect(await contracts.base.ecoXExchange.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecoXExchange.eco()).to.eq(
      contracts.base.eco.address
    )
    expect(await contracts.base.ecoXExchange.ecox()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.base.ecoXExchange.initialSupply()).to.eq(
      INITIAL_ECOx
    )

    expect(await contracts.base.ecoXStaking.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecoXStaking.ecoXToken()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.base.ecoXStaking.decimals()).to.eq(18)
    expect(await contracts.base.ecoXStaking.name()).to.eq('Staked ECOx')
    expect(await contracts.base.ecoXStaking.symbol()).to.eq('sECOx')
    expect(await contracts.base.ecoXStaking.pauser()).to.eq(
      ethers.constants.AddressZero
    )

    expect(await contracts.community.communityGovernance.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.community.communityGovernance.pauser()).to.eq(
      alice.address
    )
    expect(await contracts.community.communityGovernance.ecoToken()).to.eq(
      contracts.base.eco.address
    )
    expect(await contracts.community.communityGovernance.ecoXStaking()).to.eq(
      contracts.base.ecoXStaking.address
    )

    expect(await contracts.monetary.lockupsLever.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.lockupsLever.eco()).to.eq(
      contracts.base.eco.address
    )
    expect(await contracts.monetary.lockupsLever.depositWindow()).to.eq(
      LOCKUP_DEPOSIT_WINDOW
    )
    expect(
      await contracts.base.eco.voter(contracts.monetary.lockupsLever.address)
    ).to.be.true

    expect(await contracts.monetary.lockupsNotifier.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.lockupsNotifier.lever()).to.eq(
      contracts.monetary.lockupsLever.address
    )

    expect(await contracts.monetary.rebaseLever.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.rebaseLever.eco()).to.eq(
      contracts.base.eco.address
    )

    expect(await contracts.monetary.rebaseNotifier.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.rebaseNotifier.lever()).to.eq(
      contracts.monetary.rebaseLever.address
    )

    expect(await contracts.monetary.adapter.policy()).to.eq(
      contracts.base.policy.address
    )

    expect(await contracts.monetary.monetaryGovernance.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(
      contracts.monetary.adapter.address
    )
    expect(
      await contracts.monetary.monetaryGovernance.governanceStartTime()
    ).to.not.eq(0)

    expect(await contracts.monetary.trustedNodes.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.trustedNodes.ecoX()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.monetary.trustedNodes.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    expect(await contracts.monetary.trustedNodes.voteReward()).to.eq(
      VOTE_REWARD
    )
    expect(await contracts.monetary.trustedNodes.termLength()).to.eq(
      TRUSTEE_TERM
    )
    expect(await contracts.monetary.trustedNodes.termEnd()).to.not.eq(0)
    expect(await contracts.monetary.trustedNodes.isTrusted(alice.address)).to.be
      .false
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee1.address)).to
      .be.true
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee2.address)).to
      .be.true
  })

  it('check deployment linking', async () => {
    const contracts: Fixture = await testnetFixture(
      [trustee1.address, trustee2.address],
      alice.address,
      INITIAL_ECO,
      INITIAL_ECOx
    )

    expect(await contracts.base.policy.governor()).to.eq(
      contracts.community.communityGovernance.address
    )

    expect(await contracts.base.ecox.ecoXExchange()).to.eq(
      contracts.base.ecoXExchange.address
    )
    expect(
      await contracts.base.ecox.burners(contracts.base.ecoXExchange.address)
    ).to.be.true

    expect(
      await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
    ).to.be.true
    expect(
      await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)
    ).to.be.true
    expect(
      await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)
    ).to.be.true
    expect(
      await contracts.base.eco.snapshotters(
        contracts.community.communityGovernance.address
      )
    ).to.be.true

    expect(
      await contracts.monetary.lockupsLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.true
    expect(await contracts.monetary.lockupsLever.notifier()).to.eq(
      contracts.monetary.lockupsNotifier.address
    )
    expect(
      await contracts.monetary.rebaseLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.true
    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
      contracts.monetary.rebaseNotifier.address
    )

    expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(
      contracts.monetary.trustedNodes.address
    )
  })
})
