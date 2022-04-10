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
  useDisclosure,
  ModalBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Heading,
  Textarea,
} from '@chakra-ui/core'
import React, { useCallback, useState } from 'react'
import Account from '../components/Account'
import { useEagerConnect, useContract } from '../hooks'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider, TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { sha256 } from '@ethersproject/sha2'
import lxldaoABI from '../contracts/lxldao.json'
import { toUtf8Bytes } from '@ethersproject/strings'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { useTransactions } from '../context'

function getLogs(receipt: any, eventName: string, name: string) {
  const evt = receipt.events?.filter((x: { event: string }) => {
    return x.event == eventName
  })
  return evt[0].args[name]
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ipfsAPI = require('ipfs-http-client')
const ipfs = ipfsAPI.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

const Index = () => {
  const { colorMode } = useColorMode()
  const bgColor = { light: 'white', dark: 'gray.800' }

  const [, { addTransaction }] = useTransactions()
  const { account, chainId } = useWeb3React<Web3Provider>()
  const triedToEagerConnect = useEagerConnect()

  const ct = useContract('0xa45dd74448dd15cf844af1ab98d23438fd1ad873', lxldaoABI, true)

  const [isSendingTx, setIsSendingTx] = useState(false)
  const [secretCode, setSecretCode] = useState('')
  const [activityId, setActivityId] = useState('')
  const eventModal = useDisclosure()
  const toast = useToast()

  const handleSubmit = useCallback(
    async (values: { address: string; number: number; code: string }) => {
      if (!ct || !chainId) {
        return
      }
      setIsSendingTx(true)
      try {
        // Empty by now
        const result = await ipfs.add(JSON.stringify({}))
        if (result && result.path) {
          const despURI = toUtf8Bytes(`https://ipfs.infura.io/ipfs/${result.path}`)
          const issueNumber = BigNumber.from(values.number)
          const hashedSecretCode = sha256(toUtf8Bytes(values.code.toString()))
          const args = [values.address, issueNumber, despURI, hashedSecretCode]
          const tx = await ct.launch(...args)
          addTransaction(chainId, tx.hash)
          const launchedEvent = await tx.wait()
          const id = getLogs(launchedEvent, 'Launch', 'activityID')
          setActivityId(id.toString())
          setSecretCode(values.code)
          eventModal.onOpen()
        }
      } catch (error) {
        console.log('🚀 ~ file: index.tsx ~ line 97 ~ error', error)
      } finally {
        setIsSendingTx(false)
      }
    },
    [addTransaction, chainId, ct, eventModal]
  )

  const isDisabled = !account || isSendingTx

  return (
    <Flex align="center" justify="center" h="100vh">
      <Box bg={bgColor[colorMode]} p={6} rounded="md" w="32rem">
        <Heading mb={4}>Issue your event</Heading>

        <Formik
          initialValues={{
            address: '0x16baf0de678e52367adc69fd067e5edd1d33e3bf',
            number: 5,
            code: 'Secret code',
            // description: '',
          }}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, errors, touched }) => (
            <form onSubmit={handleSubmit}>
              <Stack direction="column" align="flex-start" spacing={4}>
                <FormControl w="full" isInvalid={!!errors.address && touched.address} isDisabled={isDisabled}>
                  <FormLabel htmlFor="address">Contract address</FormLabel>
                  <Field
                    as={Input}
                    id="address"
                    name="address"
                    variant="filled"
                    validate={(value: string) => {
                      let error

                      if (!isAddress(value)) {
                        error = 'Address incorrect'
                      }

                      return error
                    }}
                  />
                  <FormErrorMessage>{errors.address}</FormErrorMessage>
                </FormControl>

                <Field
                  name="number"
                  validate={(value: number) => {
                    let error
                    if (!Number.isInteger(value)) {
                      error = 'Number of attendees must be an integer'
                    }
                    return error
                  }}
                >
                  {({ field, form }: { field: any; form: any }) => (
                    <FormControl w="full" isInvalid={!!errors.number && touched.number} isDisabled={isDisabled}>
                      <FormLabel htmlFor="number">Number of attendees</FormLabel>
                      <NumberInput
                        id="number"
                        name="number"
                        type="number"
                        step={1}
                        min={1}
                        variant="filled"
                        w="full"
                        {...field}
                        onChange={(val) => form.setFieldValue(field.name, val)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormErrorMessage>{errors.number}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <FormControl w="full" isInvalid={!!errors.code && touched.code} isDisabled={isDisabled} mt={4}>
                  <FormLabel htmlFor="code">Event secret code</FormLabel>
                  <Field
                    as={Input}
                    id="code"
                    name="code"
                    step={1}
                    variant="filled"
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

                {account ? (
                  <Button type="submit" mt={4} isLoading={isSendingTx} isFullWidth>
                    Issue your event
                  </Button>
                ) : (
                  <Account triedToEagerConnect={triedToEagerConnect} buttonProps={{ width: 'full' }} />
                )}
              </Stack>
            </form>
          )}
        </Formik>
      </Box>

      <Modal isOpen={eventModal.isOpen} onClose={() => null} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody py={6}>
            <Heading size="md">Your Activity ID and Secret Code is</Heading>
            <Flex style={{ gap: '1rem' }} alignItems="center" mt={6}>
              <Heading size="sm">Activity ID: </Heading>
              <Textarea
                variant="unstyled"
                size="sm"
                color="purple.500"
                bg="pink.100"
                fontSize="xl"
                px={4}
                onClick={(evt: React.MouseEvent<HTMLInputElement>) => {
                  try {
                    ;((evt.target as unknown) as { select: () => void }).select()
                  } catch (e) {}
                }}
                value={activityId}
                isReadOnly
              />
            </Flex>
            <Flex style={{ gap: '1rem' }} mt={1}>
              <Heading size="sm">Secret Code: </Heading>
              <Textarea
                variant="unstyled"
                size="sm"
                color="purple.500"
                bg="pink.100"
                fontSize="xl"
                px={4}
                value={secretCode}
                onClick={(evt: React.MouseEvent<HTMLInputElement>) => {
                  try {
                    ;((evt.target as unknown) as { select: () => void }).select()
                  } catch (e) {}
                }}
                isReadOnly
              />
            </Flex>
            <Box mt={4}>
              <Heading size="2xl" color="red.500" lineHeight={1}>
                Make sure to save it before close this modal.
              </Heading>
              <Heading size="2xl" color="red.500" lineHeight={1} mt={4}>
                People are gonna claim their Attend NFT by using both Activity ID and Secret Code.
              </Heading>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={eventModal.onClose}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default Index
