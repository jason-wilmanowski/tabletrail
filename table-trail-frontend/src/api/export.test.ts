import { afterEach, expect, it, vi } from 'vitest'
import { exportDatabase } from './export'

afterEach(() => {
  vi.unstubAllGlobals()
})

it.each([true, false])('sends include_connection_details=%s with the export request', async (include) => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response('{}', { headers: { 'Content-Disposition': 'attachment; filename="Shop-Structure.json"' } })
  )
  vi.stubGlobal('fetch', fetchMock)

  const result = await exportDatabase(42, 'json', include)

  const body = JSON.parse(fetchMock.mock.calls[0][1].body)
  expect(body).toEqual({ database_id: 42, export_type: 'json', include_connection_details: include })
  expect(result.filename).toBe('Shop-Structure.json')
})
