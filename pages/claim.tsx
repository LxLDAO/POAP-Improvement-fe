import { Formik, Field } from 'formik'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Stack,
  useColorMode,
  useToast,
  Heading,
} from '@chakra-ui/core'
import React, { useCallback, useState } from 'react'
import Account from '../components/Account'
import { useEagerConnect, useContract } from '../hooks'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import lxldaoABI from '../contracts/lxldao.json'
import { toUtf8Bytes } from '@ethersproject/strings'
import { formatEtherscanLink, EtherscanType } from '../utils'
import { useTransactions } from '../context'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ipfsAPI = require('ipfs-http-client')
const ipfs = ipfsAPI.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

const Claim = () => {
  const { colorMode } = useColorMode()
  const bgColor = { light: 'white', dark: 'gray.800' }

  const [, { addTransaction }] = useTransactions()
  const { account, chainId } = useWeb3React<Web3Provider>()
  const triedToEagerConnect = useEagerConnect()

  const ct = useContract('0xa45dd74448dd15cf844af1ab98d23438fd1ad873', lxldaoABI, true)

  const [isSendingTx, setIsSendingTx] = useState(false)
  const toast = useToast()

  const handleSubmit = useCallback(
    async (values) => {
      if (!ct || !chainId) {
        return
      }
      setIsSendingTx(true)
      try {
        const result = await ipfs.add(JSON.stringify({}))
        if (result && result.path) {
          const commentURI = toUtf8Bytes(`https://ipfs.infura.io/ipfs/${result.path}`)
          const hashedSecretCode = toUtf8Bytes(values.code)
          const tx = await ct.claim(hashedSecretCode, commentURI, values.id)
          addTransaction(chainId, tx.hash)
          const claimedTx = await tx.wait()
          setIsSendingTx(false)
          toast({
            // eslint-disable-next-line react/display-name
            render: () => (
              <Button
                as="a"
                leftIcon="check"
                rightIcon="external-link"
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                {...{
                  href: formatEtherscanLink(EtherscanType.Transaction, [chainId as number, claimedTx.hash]),
                  target: '_blank',
                  rel: 'noopener noreferrer',
                }}
              >
                Claim successful, checkout your transaction on etherscan!
              </Button>
            ),
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: index.tsx ~ line 97 ~ error', error)
        toast({
          status: 'error',
          title: 'Claim failed, it might due to wrong secret code or activity id',
        })
      } finally {
        setIsSendingTx(false)
      }
    },
    [addTransaction, chainId, ct, toast]
  )

  const isDisabled = !account || isSendingTx

  return (
    <Flex align="center" justify="center" h="100vh">
      <Box bg={bgColor[colorMode]} p={6} rounded="md" w="32rem">
        <Heading mb={4}>Claim your attendant NFT</Heading>

        <Formik
          initialValues={{
            id: 1,
            code: 'Secret code',
            // description: '',
          }}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, errors, touched }) => (
            <form onSubmit={handleSubmit}>
              <Stack direction="column" align="flex-start" spacing={4}>
                <FormControl w="full" isInvalid={!!errors.code && touched.code} isDisabled={isDisabled} mt={4}>
                  <FormLabel htmlFor="code">Event secret code</FormLabel>
                  <Field
                    as={Input}
                    id="code"
                    name="code"
                    step={1}
                    variant="filled"
                    placeholder="Enter secret code to get your attendant NFT"
                    validate={(value: number) => {
                      let error

                      if (!value) {
                        error = 'Event secret code is required!'
                      }

                      return error
                    }}
                  />
                  <FormErrorMessage>{errors.code}</FormErrorMessage>
                </FormControl>

                <FormControl w="full" isInvalid={!!errors.id && touched.id} isDisabled={isDisabled}>
                  <FormLabel htmlFor="id">Activity ID</FormLabel>
                  <Field
                    as={Input}
                    id="id"
                    name="id"
                    variant="filled"
                    validate={(value: string) => {
                      let error

                      if (!value) {
                        error = 'Activity id is required!'
                      }

                      if (!Number.isInteger(+value)) {
                        error = 'ID Invalid'
                      }

                      return error
                    }}
                    placeholder="1"
                  />
                  <FormErrorMessage>{errors.id}</FormErrorMessage>
                </FormControl>

                {account ? (
                  <Button type="submit" mt={4} isLoading={isSendingTx} isFullWidth>
                    Claim your attendant NFT
                  </Button>
                ) : (
                  <Account triedToEagerConnect={triedToEagerConnect} buttonProps={{ width: 'full' }} />
                )}
              </Stack>
            </form>
          )}
        </Formik>
      </Box>
    </Flex>
  )
}

export default Claim
