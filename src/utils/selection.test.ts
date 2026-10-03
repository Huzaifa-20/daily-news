import { describe, expect, it } from 'vitest'
import { isSelected, toggleSubset } from './selection'

const ALL = ['a', 'b', 'c'] as const

describe('toggleSubset', () => {
  it('deselecting from "everything" leaves the rest selected', () => {
    expect(toggleSubset([], 'b', ALL)).toEqual(['a', 'c'])
  })

  it('collapses back to "everything" once all items are selected', () => {
    expect(toggleSubset(['a', 'c'], 'b', ALL)).toEqual([])
  })

  it('never deselects the last item', () => {
    expect(toggleSubset(['a'], 'a', ALL)).toEqual(['a'])
  })
})

describe('isSelected', () => {
  it('treats an empty selection as everything', () => {
    expect(isSelected([], 'a')).toBe(true)
    expect(isSelected(['b'], 'a')).toBe(false)
  })
})
