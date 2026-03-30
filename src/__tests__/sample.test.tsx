import { describe, it, expect } from 'vitest'

describe('Basic Math Tests', () => {
  it('adds 1 + 1 to equal 2', () => {
    expect(1 + 1).toBe(2)
  })

  it('multiplies 2 * 3 to equal 6', () => {
    expect(2 * 3).toBe(6)
  })

  it('checks array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr).toContain(3)
    expect(arr).not.toContain(6)
  })
})

describe('String Operations', () => {
  it('concatenates strings correctly', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World')
  })

  it('checks string length', () => {
    expect('XMLSpy Clone').toHaveLength(12)
  })

  it('performs string includes check', () => {
    expect('XMLSpy Clone'.toLowerCase()).toContain('xmlspy')
  })
})

describe('Object Operations', () => {
  it('creates and compares objects', () => {
    const obj = { name: 'Test', value: 42 }
    expect(obj).toHaveProperty('name', 'Test')
    expect(obj).toHaveProperty('value', 42)
  })

  it('checks object keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(Object.keys(obj)).toHaveLength(3)
  })
})

