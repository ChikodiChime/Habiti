import { calculateStreaks } from "@/src/lib/streak-calculator"
import { getServerClient } from "@/src/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { supabase, user } = await getServerClient()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const habit_id = searchParams.get('habit_id')

  if (!habit_id) {
    return NextResponse.json({ error: 'habit_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('done_records')
    .select('*')
    .eq('habit_id', habit_id)
    .eq('user_id', user.id)
    .order('date_done', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerClient()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized'}, { status: 401 })
  }
  
  const { habit_id, date_done } = await request.json()
  if (!habit_id) {
    return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
  }
  const dateDone = date_done || new Date().toISOString().split('T')[0]
  
  try {
    // 1. Insert the done record
    const { data: doneRecord, error: insertError } = await supabase
      .from('done_records')
      .insert({
        habit_id: habit_id,
        user_id: user.id,
        date_done: dateDone
      })
      .select()
      .single()

    if (insertError) {
      // Friendly duplicate guard: unique constraint on (habit_id, date_done)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You already marked this habit as done today!' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 2. Get the habit details
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single()

    if (habitError) {
      return NextResponse.json({ error: habitError.message }, { status: 500 })
    }

    // 3. Get all done records for this habit
    const { data: allDoneRecords, error: recordsError } = await supabase
      .from('done_records')
      .select('date_done')
      .eq('habit_id', habit_id)
      .eq('user_id', user.id)

    if (recordsError) {
      return NextResponse.json({ error: recordsError.message }, { status: 500 })
    }

    // 4. Calculate new streaks
    const { currentStreak, longestStreak } = calculateStreaks(
      allDoneRecords || [], 
      habit.created_at
    )

    // 5. Update the habit with new streaks
    const { error: updateError } = await supabase
      .from('habits')
      .update({
        current_streak: currentStreak,
        longest_streak: Math.max(longestStreak, habit.longest_streak || 0)
      })
      .eq('id', habit_id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Return the done record with updated streak info
    return NextResponse.json({
      ...doneRecord,
      habit_name: habit.name,
      updated_streaks: {
        current_streak: currentStreak,
        longest_streak: Math.max(longestStreak, habit.longest_streak || 0)
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}