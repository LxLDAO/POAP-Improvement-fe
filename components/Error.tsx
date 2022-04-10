import { Flex, Stack, Text } from '@chakra-ui/core'
import SwitchToChain from './SwitchToChain'

type ErrorProps = {
  error?: Error
}

export default function Error({ error }: ErrorProps): JSX.Element {
  console.log('🚀 ~ file: Error.tsx ~ line 10 ~ Error ~ error', error)
  if (error && error.name === 'UnsupportedChainIdError') {
    return <SwitchToChain requiredChainId={4} />
  }

  return (
    <Flex flexGrow={1} alignItems="center" justifyContent="center">
      <Stack direction="column" alignItems="center">
        <Text fontSize="1.5rem">Something went wrong.</Text>
        <Text>Try checking your internet connection, refreshing the page, or visiting from a different browser.</Text>
      </Stack>
    </Flex>
  )
}
