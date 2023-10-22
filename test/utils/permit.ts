import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { ethers } from 'hardhat'
import { BigNumberish, Wallet } from 'ethers'
import { ECO, ERC20 } from '../../typechain-types'

interface PermitMessageDataDTO {
  name: string
  address: string
  chainId: string
  signer: string
  consumer: string
  value?: BigNumberish
  nonce: BigNumberish
  deadline: number
}

export function createPermitMessageData(data: PermitMessageDataDTO) {
  const {
    name,
    address,
    chainId,
    signer: owner,
    consumer: spender,
    value,
    nonce,
    deadline,
  } = data

  const message = {
    owner,
    spender,
    value,
    nonce,
    deadline,
  }

  return {
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name,
      version: '1',
      chainId,
      verifyingContract: address,
    },
    message,
  }
}

export async function permit(
  token: ERC20,
  owner: Wallet,
  spender: Wallet,
  chainId: number,
  amount: BigNumberish,
  deadline: number = Math.floor(new Date().getTime() / 1000 + 86400 * 3000)
) {
  const nonce = await token.nonces(owner.address)

  const permitData = createPermitMessageData({
    name: await token.name(),
    address: token.address,
    signer: owner.address,
    consumer: spender.address,
    value: amount.toString(),
    nonce: nonce.toString(),
    chainId: chainId.toString(),
    deadline,
  })
  const sig = signTypedData({
    privateKey: Buffer.from(owner._signingKey().privateKey.slice(2), 'hex'),
    data: permitData,
    version: SignTypedDataVersion.V4,
  })
  const { v, r, s } = ethers.utils.splitSignature(sig)

  return token.permit(owner.address, spender.address, amount, deadline, v, r, s)
}

export function createDelegatePermitMessageData(data: PermitMessageDataDTO) {
  const {
    name,
    address,
    chainId,
    signer: delegator,
    consumer: delegatee,
    nonce,
    deadline,
  } = data

  const message = {
    delegator,
    delegatee,
    nonce,
    deadline,
  }

  return {
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      Delegate: [
        {
          name: 'delegator',
          type: 'address',
        },
        {
          name: 'delegatee',
          type: 'address',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    primaryType: 'Delegate',
    domain: {
      name,
      version: '1',
      chainId,
      verifyingContract: address,
    },
    message,
  }
}

export async function delegateBySig(
  token: ECO,
  delegator: { address: string; privateKey: string },
  delegatee: { address: string },
  chainId: number,
  sender: Wallet,
  {
    deadline = Math.floor(new Date().getTime() / 1000 + 86400 * 3000),
    nonce = '-1',
    signer = delegator,
  }
) {
  const nonceToUse =
    nonce === '-1' ? await token.delegationNonce(delegator.address) : nonce

  const delegationData = createDelegatePermitMessageData({
    name: await token.name(),
    address: token.address,
    signer: delegator.address,
    consumer: delegatee.address,
    nonce: nonceToUse.toString(),
    chainId: chainId.toString(),
    deadline,
  })
  const sig = signTypedData({
    privateKey: Buffer.from(signer.privateKey.slice(2), 'hex'),
    data: delegationData,
    version: SignTypedDataVersion.V4,
  })
  const { v, r, s } = ethers.utils.splitSignature(sig)

  return token
    .connect(sender)
    .delegateBySig(delegator.address, delegatee.address, deadline, v, r, s, {
      gasLimit: 1000000,
    })
}
