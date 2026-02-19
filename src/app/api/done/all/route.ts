import { getServerClient } from "@/src/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  const { supabase, user } = await getServerClient()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('done_records')
    .select('id, habit_id, date_done')
    .eq('user_id', user.id)
    .order('date_done', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
