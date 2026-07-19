import { useParams } from 'react-router-dom'

export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <h1 className="text-xl font-semibold">Database Detail</h1>
      <p className="text-sm text-neutral-500">
        Database id: {id}
      </p>
    </div>
  )
}
