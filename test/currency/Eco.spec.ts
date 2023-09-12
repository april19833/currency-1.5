import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../utils/constants'
import { ERRORS } from '../utils/errors'
import {
    ECO,
  ECO__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'

const INITIAL_SUPPLY = '1' + '000'.repeat(7) // 1000 eco initially

describe.only('Eco', () => {
    let alice: SignerWithAddress // distributer
    let bob: SignerWithAddress // pauser
    let charlie: SignerWithAddress
    let dave: SignerWithAddress
    let policyImpersonater: SignerWithAddress
    before(async () => {
      ;[policyImpersonater, alice, bob, charlie, dave] =
        await ethers.getSigners()
    })
  
    let ECOimpl: ECO
    let ECOproxy: ECO
    let Fake__Policy: FakeContract<Policy>
  
    beforeEach(async () => {
        // Get a new mock L1 messenger
        Fake__Policy = await smock.fake<Policy>(
            'Policy',
            { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
        )

        const ECOfact = new ECO__factory
    
        ECOimpl = await ECOfact
            .connect(policyImpersonater)
            .deploy(Fake__Policy.address, alice.address, INITIAL_SUPPLY, bob.address)


        const proxy = await new ForwardProxy__factory()
            .connect(policyImpersonater)
            .deploy(ECOimpl.address)

        ECOproxy = ECOfact.attach(proxy.address)

        expect(ECOproxy.address === proxy.address).to.be.true;
    })

    it('test', async () => {
        console.log('test')
    })
})