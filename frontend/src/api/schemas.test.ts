import { describe, expect, it } from 'vitest'

import { clientSchema, userSchema } from '@/api/schemas'

describe('api schemas', () => {
  it('parses user payload', () => {
    const payload = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      avatar: '/avatar.png',
      groups: [{ id: 1, name: 'admin', description: 'Admin' }],
    }
    const parsed = userSchema.parse(payload)
    expect(parsed.name).toBe('Alice')
    expect(parsed.groups[0].name).toBe('admin')
  })

  it('fills default empty credentials', () => {
    const payload = {
      id: 1,
      user_id: 2,
      name: 'client1',
      email: 'c1@example.com',
      created_at: '2020-01-01T00:00:00Z',
      modified_at: '2020-01-01T00:00:00Z',
    }
    const parsed = clientSchema.parse(payload)
    expect(parsed.credentials).toEqual([])
  })
})
