import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import {
  TrustedNodes__factory,
  TrustedNodes,
  CurrencyGovernance__factory,
  CurrencyGovernance,
  StageTestCurrencyGovernance__factory,
  StageTestCurrencyGovernance,
  DummyMonetaryPolicyAdapter__factory,
  DummyMonetaryPolicyAdapter,
  Policy,
  ECO,
  ECOxStaking,
  ECOxStaking__factory,
} from '../../../typechain-types'

describe('Community Governance', () => {
    let policyImpersonator: SignerWithAddress
    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let charlie: SignerWithAddress
    let dave: SignerWithAddress
    before(async () => {
        ;[policyImpersonator, alice, bob, charlie, dave] =
        await ethers.getSigners()
    })
    let eco: MockContract<ECO>
    let ecoXStaking: MockContract<ECOxStaking>


    beforeEach( async () => {
        
    })

    it('Constructs', async () => {

    })
    describe('permissions', () => {
        it('is permissioned', async () => {

        })

    })
})