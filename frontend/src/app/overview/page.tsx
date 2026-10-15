import React from "react"
import Link from "next/link"
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { names } from "../../labels/names"

export const metadata = {
  title: 'Advertisements',
}

// "1913-11-15" → "15 November 1913", "1913-11" → "November 1913"
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  if (!month) return year
  const name = new Date(Date.UTC(Number(year), Number(month) - 1))
    .toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })
  return [day && String(Number(day)), name, year].filter(Boolean).join(' ')
}

export default function OverviewPage() {
  const allMetadata = getAllMetadata()

  return (
    <Container component="main" maxWidth="md">
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Newspapers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allMetadata.map((meta, i) => (
              <TableRow key={`metadata_${i}`}>
                <TableCell>
                  {names[meta.company.name] || meta.company.name}
                </TableCell>
                <TableCell>
                  <Link href={`/${meta.slug}`}>
                    {meta.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {meta.dates.map((date, j) => (
                    <div key={`${i}_${j}`}>
                      {formatDate(date)}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {meta.newspapers.map((newspaper, j) => (
                    <div key={`${i}_${j}`}>
                      {newspaper.replace('&amp;', '&')}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}
