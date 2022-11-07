import { Box, Center, Heading, Image, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import FeaturesList from '../components/FeaturesList'
import Hero from '../components/Hero'
import Layout from '../components/Layout'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import NormalButton from '../components/common/NormalButton'
import GritNFT from '../grit-nfts.json'
import { NFTMetadata } from '../types/nftMetadata'

interface Window {
  ethereum?: ethers.providers.ExternalProvider
}

const CONTRACT_ADDRESS = '0xc0F43D539883532d0A5099ebBc63F2C6A4B70ecC'

export default function Home() {
  const [account, setAccount] = useState<string>(null)

  // NFT metadata
  const [nftName, setnftName] = useState<string>('')
  const [nftDescription, setNftDescription] = useState<string>('')
  const [nftDueDate, setNftDueDate] = useState<number>(0)

  // User's data
  const [userNFTs, setUserNFTs] = useState<NFTMetadata[]>([])

  const [isSending, setIsSending] = useState(false)
  const [gritNFTContract, setGritNFTContract] = useState<ethers.Contract>(null)

  // Effect

  useEffect(() => {
    ;(async () => {
      // Set up contract
      const { ethereum } = window as Window
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const gritNFTContract = new ethers.Contract(CONTRACT_ADDRESS, GritNFT.abi, signer)
      setGritNFTContract(gritNFTContract)

      await checkIfWalletIsConnected()
    })()
  }, [])

  useEffect(() => {
    fetchUserAllNFTs(account)
  }, [account])

  // Methods

  const checkIfWalletIsConnected = async (): Promise<string> => {
    const { ethereum } = window as Window
    if (!ethereum) {
      console.log('Make sure you have MetaMask!')
      return null
    } else {
      console.log('We have the ethereum object', ethereum)
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' })

    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log('Found an authorized account:', account)
      setAccount(account)
      return account
    } else {
      console.log('No authorized account found')
      return null
    }
  }

  const checkNetwork = async () => {
    const { ethereum } = window as Window
    let chainId = await ethereum.request({ method: 'eth_chainId' })
    console.log('Connected to chain ' + chainId)
    // 0x5はGoerliのID
    const goerliChainId = '0x5'
    if (chainId !== goerliChainId) {
      alert('You are not connected to the Goerli Test Network.')
    }
  }

  const requestToConnectWallet = async () => {
    setIsSending(true)
    try {
      const { ethereum } = window as Window
      if (!ethereum) {
        alert('Get wallet firtt.')
        return
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      console.log('cuccrent accout', accounts[0])
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      console.log(error)
    }
  }

  const requestContractToMint = async (metadata: NFTMetadata) => {
    setIsSending(true)
    try {
      const transaction = await gritNFTContract.makeNFT(
        metadata.name,
        metadata.description,
        metadata.dueDate,
      )
      await transaction.wait()
      console.log(`${metadata} is minted`)
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      console.log(error)
    }
  }

  // Event handlers

  const onClickConnectWallet = async () => {
    await requestToConnectWallet()
    await checkIfWalletIsConnected()
  }

  const makeNFT = async () => {
    setIsSending(true)
    try {
      const requestMetadata = new NFTMetadata(-1, nftName, nftDescription, '', -1, nftDueDate, 0)
      console.log('start mint NFT')
      console.log('request metadata: ', requestMetadata)
      await requestContractToMint(requestMetadata)
      console.log('finish mint NFT')
      fetchUserAllNFTs(account)

      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      console.log(error)
    }
  }

  const fetchUserAllNFTs = async (accountAddress: string) => {
    setIsSending(true)
    try {
      const { ethereum } = window as Window
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const gritNFTContract = new ethers.Contract(CONTRACT_ADDRESS, GritNFT.abi, signer)
      const tokenIDs = await gritNFTContract.getTokenIds(accountAddress)
      console.log('getTokenIds', tokenIDs.length)

      if (tokenIDs.length > 0) {
        const metadatas = await gritNFTContract.getMetadatas(tokenIDs)
        const nftMetadatas: NFTMetadata[] = []
        for (let i = 0; i < tokenIDs.length; i++) {
          const data = NFTMetadata.fromJSON(metadatas[i], tokenIDs[i])
          nftMetadatas.push(data)
        }
        console.log('nftMetadatas', nftMetadatas)
        setUserNFTs(nftMetadatas)
      }
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      console.log(error)
    }
  }

  const onClickAchieve = async (data: NFTMetadata) => {
    setIsSending(true)
    try {
      // TODO: 期限の判別をより厳密にするならcontractのfunctionをcallした方がいい
      if (data.isExpired()) {
        const transaction = await gritNFTContract.updateNFTOf(data.tokenID, {
          value: ethers.utils.parseUnits('0.01', 'ether'),
        })
        await transaction.wait()
        console.log(`expided tokenID(${data.tokenID}) is achieved`)
      } else {
        const transaction = await gritNFTContract.updateNFTOf(data.tokenID)
        await transaction.wait()
        console.log(`tokenID(${data.tokenID}) is achieved`)
      }
      setIsSending(false)
      fetchUserAllNFTs(account)
    } catch (error) {
      setIsSending(false)
      console.log(error)
    }
  }

  const demo = async () => {}

  return (
    <Layout>
      <VStack spacing={4} align='center' paddingY={8}>
        <Hero />
        <FeaturesList />
        <Heading fontSize={'3xl'} pt={10}>
          Try
        </Heading>
        {/* アカウント情報 */}
        {account == null && (
          <NormalButton
            title='ウォレットに接続しましょう'
            isSending={isSending}
            onClick={onClickConnectWallet}
          />
        )}
        {/* NFT作成 */}
        <Box>
          <VStack spacing={10} align='stretch'>
            <Box>
              <Text fontWeight={600}>1. やることを入力しましょう</Text>
              <Text color={'gray.600'}>（例）体重-5kg, 毎朝8時に起きる</Text>
              <Input
                id='title'
                placeholder='やること'
                value={nftName}
                onChange={(e) => {
                  setnftName(e.target.value)
                }}
                required
              />
              <Input
                id='description'
                placeholder='意気込みや、やることの詳細'
                value={nftDescription}
                onChange={(e) => {
                  setNftDescription(e.target.value)
                }}
                required
              />
            </Box>

            <Box>
              <Text fontWeight={600}>2. いつまでにそれを達成したいですか？</Text>
              <Input
                id='due date'
                placeholder='Select Date'
                size='md'
                type='date'
                onChange={(e) => {
                  const unixTime = new Date(e.target.value).getTime() / 1000
                  setNftDueDate(unixTime)
                }}
                required
              />
            </Box>

            <Box>
              <Text fontWeight={600}>3. NFT化しよう！</Text>
              <Center h='100%'>
                <NormalButton title='Create NFT' isSending={isSending} onClick={makeNFT} />
              </Center>
            </Box>
          </VStack>
        </Box>
        {/* ユーザーのNFT一覧 */}
        {userNFTs.length > 0 && (
          <Heading fontSize={'3xl'} pt={10}>
            Your NFTs
          </Heading>
        )}
        {userNFTs.length > 0 && (
          <Box>
            <SimpleGrid columns={{ sm: 2, md: 3 }} spacing='40px'>
              {userNFTs.map((data) => (
                <Box key={data.tokenID}>
                  <Text>{data.dispyaStatus()}</Text>
                  <Image src={data.imageSVG} alt={data.name} />
                  <Text noOfLines={1}>{data.description}</Text>
                  <Text>{data.displayDueDate()}</Text>
                  {!data.isAchieved() && (
                    <NormalButton
                      title='Achieved!'
                      isSending={isSending}
                      onClick={async () => await onClickAchieve(data)}
                    />
                  )}
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Layout>
  )
}
