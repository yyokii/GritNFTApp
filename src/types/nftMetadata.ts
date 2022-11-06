import { BigNumber } from 'ethers'

class NFTMetadata {
  tokenID: number
  name: string
  description: string
  imageSVG: string
  createdAt: number
  dueDate: number
  achievedAt: number

  constructor(
    tokenID: number,
    name: string,
    description: string,
    imageSVG: string,
    createdAt: number,
    dueDate: number,
    achievedAt: number,
  ) {
    this.tokenID = tokenID
    this.name = name
    this.description = description
    this.imageSVG = imageSVG
    this.createdAt = createdAt
    this.dueDate = dueDate
    this.achievedAt = achievedAt
  }

  /**
   * Create NFTMetadata from the NFT contract response
   *
   * @param json: NFT contract response
   * @param tokenID: NFT token ID
   * @returns NFTMetadata
   */
  static fromJSON(json: any, tokenID: number): NFTMetadata {
    const createdAt: number = (json.createdAt as BigNumber).toNumber()
    const dueDate: number = (json.dueDate as BigNumber).toNumber()
    const achievedAt: number = (json.achievedAt as BigNumber).toNumber()

    return new NFTMetadata(
      tokenID,
      json.name,
      json.description,
      json.imageSVG,
      createdAt,
      dueDate,
      achievedAt,
    )
  }

  isExpired(): boolean {
    return this.dueDate < Date.now() / 1000
  }

  dispyaStatus(): string {
    if (this.isAchieved()) {
      return 'Achieved'
    } else if (this.isExpired()) {
      return 'Expired'
    } else {
      return 'In Progress'
    }
  }

  displayDueDate(): string {
    return new Date(this.dueDate * 1000).toLocaleDateString()
  }

  isAchieved(): boolean {
    return this.achievedAt > 0
  }
}

export { NFTMetadata }
