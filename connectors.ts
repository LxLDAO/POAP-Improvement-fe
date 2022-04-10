import { NetworkConnector } from '@web3-react/network-connector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

import { INFURA_PREFIXES } from './utils'
import { ChainId } from '@uniswap/sdk'

const supportedChainIds = [
  // ChainId.MAINNET,
  // ChainId.ROPSTEN,
  ChainId.RINKEBY,
  // ChainId.GÖRLI,
  // ChainId.KOVAN
]

export function getNetwork(defaultChainId = 1): NetworkConnector {
  return new NetworkConnector({
    urls: supportedChainIds.reduce(
      (urls, chainId) =>
        Object.assign(urls, {
          [chainId]: `https://${INFURA_PREFIXES[chainId]}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        }),
      {}
    ),
    defaultChainId,
  })
}

export const injected = new InjectedConnector({ supportedChainIds })

export const walletconnect = new WalletConnectConnector({
  rpc: {
    1: `https://${INFURA_PREFIXES[1]}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  },
  bridge: 'https://bridge.walletconnect.org',
})
