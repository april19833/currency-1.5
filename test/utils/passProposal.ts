import { Contract } from 'ethers'
import { Fixture } from '../../deploy/standalone.fixture'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

// assumes that the signer has a super majority
async function passProposal(
  contracts: Fixture,
  signer: SignerWithAddress,
  proposal: Contract
) {
  if (!(await contracts.base.eco.voter(signer.address))) {
    await contracts.base.eco.connect(signer).enableVoting()
  }

  // update the governance contract's cycle timing data
  await contracts.community.communityGovernance.updateStage()

  // go to next voting cycle
  await time.increaseTo(
    (
      await contracts.community.communityGovernance.cycleStart()
    ).add(await contracts.community.communityGovernance.CYCLE_LENGTH())
  )

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
