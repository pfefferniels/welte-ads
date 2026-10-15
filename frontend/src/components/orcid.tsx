import React from "react"
import Image from "next/image"
import orcidIcon from "../images/orcid.png"

interface Props {
  id: string
  // ORCID asks to show the iD as a full URL wherever there is room
  showId?: boolean
}

const OrcidLink = ({ id, showId = false }: Props) => (
  <a href={`https://orcid.org/${id}`} style={{ marginLeft: '.5rem' }}>
    <Image src={orcidIcon} width={20} height={20} alt="ORCID iD"
      style={{ verticalAlign: 'middle', marginRight: showId ? '.25rem' : 0 }} />
    {showId && `https://orcid.org/${id}`}
  </a>
)

export default OrcidLink
