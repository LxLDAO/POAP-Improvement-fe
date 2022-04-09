import { useState, useEffect } from 'react'
import { Button, Spinner, IconButton, ButtonGroup } from '@chakra-ui/core'
import { useWeb3React } from '@web3-react/core'

import { useTransactions } from '../context'
import { shortenHex, EtherscanType, formatEtherscanLink } from '../utils'

export function TransactionToast({ hash }: { hash: string }): JSX.Element {
  const { library, chainId } = useWeb3React()

  const [, { removeTransaction }] = useTransactions()

  const [confirmed, setConfirmed] = useState<boolean>()
  useEffect(() => {
    if (library) {
      let mounted = true

      library.waitForTransaction(hash).then((receipt: { status: number }) => {
        if (mounted) {
          setConfirmed(receipt.status === 1 ? true : false)
        }
      })

      return (): void => {
        mounted = false
      }
    }
  }, [library, hash])

  return (
    <ButtonGroup spacing={0}>
      <Button
        as="a"
        variantColor={typeof confirmed === 'boolean' ? (confirmed ? 'green' : 'red') : 'blue'}
        leftIcon={
          typeof confirmed === 'boolean'
            ? confirmed
              ? 'check-circle'
              : 'warning'
            : (): JSX.Element => <Spinner size="sm" mr="0.5rem" ml="-0.25rem" />
        }
        rightIcon="external-link"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        {...{
          href: formatEtherscanLink(EtherscanType.Transaction, [chainId as number, hash]),
          target: '_blank',
          rel: 'noopener noreferrer',
        }}
      >
        {shortenHex(hash, 2)}
      </Button>

      <IconButton
        icon="close"
        variantColor={typeof confirmed === 'boolean' ? (confirmed ? 'green' : 'red') : 'blue'}
        aria-label="Close"
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        borderLeft="1px solid white"
        onClick={(): void => {
          removeTransaction(chainId as number, hash)
        }}
      />
    </ButtonGroup>
  )
}
