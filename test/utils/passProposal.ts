import { Contract } from 'ethers'
import { Fixture } from '../../deploy/standalone.fixture'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { DAY } from './constants'

async function passProposal(
  contracts: Fixture,
  proposal: Contract,
  signer: SignerWithAddress
) {
  if (!(await contracts.base.eco.voter(signer.address))) {
    await contracts.base.eco.connect(signer).enableVoting()
  }

  // go to next voting cycle
  await time.increase(14 * DAY)
  // update stage to Done
  await contracts.community.communityGovernance.updateStage()

  // push to next cycle which snapshots signer's new voting power
  await contracts.community.communityGovernance.updateStage()

  // push the proposal through voting
  await contracts.base.eco
    .connect(signer)
    .approve(
      contracts.community.communityGovernance.address,
      await contracts.community.communityGovernance.proposalFee()
    )
  await contracts.community.communityGovernance
    .connect(signer)
    .propose(proposal.address)
  await contracts.community.communityGovernance
    .connect(signer)
    .support(proposal.address)
  await contracts.community.communityGovernance.connect(signer).vote(1)
  await contracts.community.communityGovernance.connect(signer).execute()
}

export { passProposal }
