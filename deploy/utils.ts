import { Contract, ContractFactory, Signer } from 'ethers'
import { ForwardProxy__factory } from '../typechain-types'

/**
 * Deploy a contract with the given factory from a certain address
 * Will be deployed by the given deployer address with the given params
 */
export async function deploy<F extends ContractFactory>(
  from: Signer,
  FactoryType: { new (from: Signer): F },
  params?: any[]
): Promise<Contract> {
  const factory = new FactoryType(from)
  return params ? factory.deploy(...params) : factory.deploy()
}

/**
 * Deploy a proxied contract with the given factory from a certain address
 * Will be deployed with the given params
 */
export async function deployProxy<F extends ContractFactory>(
  from: Signer,
  FactoryType: { new (from: Signer): F },
  params?: any[]
): Promise<Contract> {
  const factory = new FactoryType(from)
  const base = params ? await factory.deploy(...params) : await factory.deploy()
  const proxy = await new ForwardProxy__factory(from).deploy(base.address)
  return factory.attach(proxy.address)
}
