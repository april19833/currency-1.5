import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {
  ECO,
  ECO__factory,
  ECOx,
  ECOxStaking,
  ECOxStaking__factory,
  ECOx__factory,
  Policy,
  Policy__factory,
} from '@helix-foundation/currency-dev'

// const PolicyImpl = '0xfe07979a9Cc0113f7976964A30477aC670caF79D'
const PolicyProxy = '0x8c02D4cc62F79AcEB652321a9f8988c0f6E71E68'
// const ECOImpl = '0xE70812Cecf8768f4dc6ff09eE1c3D121d5f23EB3'
const ECOProxy = '0x8dBF9A4c99580fC7Fd4024ee08f3994420035727'
// const ECOxImpl = '0x429FE295ca0c49Be43557646b9260f2f2e0FeD23'
const ECOxProxy = '0xcccD1Ba9f7acD6117834E0D28F25645dECb1736a'
// const TrustedNodesImpl = '0xD51F3102D026EE1F2849EfB72a6A908883358F40'
// const TrustedNodesProxy = '0x9fA130E9d1dA166164381F6d1de8660da0afc1f1'
// const ECOxStakingImpl = '0x268A47Ea17E5262decD215a72af4b617537FE377'
const ECOxStakingProxy = '0x3a16f2Fee32827a9E476d0c87E454aB7C75C92D7'
// const CurrencyTimerProxy = '0x953d8bC7410D189C83713151bA506D33ea5Bf995'
// const TimedPoliciesProxy = '0x1E5F34C1281BE1249074b987FdDd295685e1ACCb'

export type OldEcoProxies = {
  policy: Policy
  eco: ECO
  ecox: ECOx
  ecoXStaking: ECOxStaking
}

export async function getExistingEco(
  defaultSigner: SignerWithAddress
): Promise<OldEcoProxies> {
  const policy = new Policy__factory(defaultSigner).attach(PolicyProxy)
  const eco = new ECO__factory(defaultSigner).attach(ECOProxy)
  const ecox = new ECOx__factory(defaultSigner).attach(ECOxProxy)
  const ecoXStaking = new ECOxStaking__factory(defaultSigner).attach(
    ECOxStakingProxy
  )

  return {
    policy,
    eco,
    ecox,
    ecoXStaking,
  }
}
