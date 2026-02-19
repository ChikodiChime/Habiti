import { getServerClient } from "@/src/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const { supabase, user } = await getServerClient()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
    
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerClient();

   if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await request.json()

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: name.trim(),
      current_streak: 0,
      longest_streak: 0
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getServerClient();

   if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const habitId = searchParams.get('id')

  if (!habitId) {
    return NextResponse.json({error: 'Habit ID is required'}, { status: 400})
  }

  const {error} = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', user.id)
  
  if (error) {
    return NextResponse.json({error: error.message}, { status: 500})
  }
  
  return NextResponse.json({message: 'Habit deleted successfully'})
}
