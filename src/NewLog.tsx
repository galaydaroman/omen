import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router'

export default function NewLog() {
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name')

  return <>
    <p>New log steps for {name}</p>
    <Link to="/">Back</Link>
  </>
}
