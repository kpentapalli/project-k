import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server misconfiguration — missing env vars' })
  }

  // Admin Supabase client (service role — never exposed to browser)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify the caller is an authenticated admin
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid session' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — admin only' })
  }

  // Extract and validate request body
  const { email, name, requestId } = req.body || {}
  if (!email || !requestId) {
    return res.status(400).json({ error: 'Missing email or requestId' })
  }

  // Send the Supabase invite email
  const siteUrl = process.env.SITE_URL || 'https://project-k-ten-mu.vercel.app'
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name || '' },
    redirectTo: siteUrl,
  })

  if (inviteError) {
    // Surface Supabase errors clearly (e.g. "User already registered")
    return res.status(422).json({ error: inviteError.message })
  }

  // Mark the access request as approved
  await supabase
    .from('access_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)

  return res.status(200).json({ success: true })
}
