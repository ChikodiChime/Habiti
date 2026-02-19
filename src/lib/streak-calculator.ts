export interface DoneRecord {
  date_done: string
}

export function calculateStreaks(doneRecords: DoneRecord[], habitStartDate: string) {
  // Convert done records to a Set for fast lookup
  const doneDates = new Set(doneRecords.map(record => record.date_done))
  
  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  
  // Start from today and go backward
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    
    // If this date is done, increment streak
    if (doneDates.has(dateStr)) {
      currentStreak++
    } else {
      // Stop at first gap (unless it's today - today being missed breaks streak)
      break
    }
  }
  
  // Calculate longest streak (scan entire history)
  let longestStreak = 0
  let tempStreak = 0
  
  // Get all dates from habit start to today
  const startDate = new Date(habitStartDate)
  const endDate = new Date()
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    
    if (doneDates.has(dateStr)) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  
  return { currentStreak, longestStreak }
}