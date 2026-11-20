import { describe, expect, it } from 'vitest'
import { getsRun, scheduleLabel } from './schedule'

describe('server schedules', () => {
  it('says which runs a server gets', () => {
    expect([getsRun('both', 'am'), getsRun('both', 'pm')]).toEqual([true, true])
    expect([getsRun('am', 'am'), getsRun('am', 'pm')]).toEqual([true, false])
    expect([getsRun('pm', 'am'), getsRun('pm', 'pm')]).toEqual([false, true])
    expect([getsRun('manual', 'am'), getsRun('manual', 'pm')]).toEqual([false, false])
    expect(getsRun(undefined, 'pm')).toBe(true) // older data: both
  })

  it('labels them for the server row', () => {
    expect(scheduleLabel('am')).toBe('10 AM only')
    expect(scheduleLabel('manual')).toBe('Manual only')
    expect(scheduleLabel(undefined)).toBe('10 AM + 10 PM')
  })
})
