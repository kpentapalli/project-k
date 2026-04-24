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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { email, password, code } = req.body || {}

  if (!email || !password || !code) {
    return res.status(400).json({ error: 'Missing email, password, or invite code' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  // Atomically claim a slot in the code — returns the row on success, empty on failure
  const { data: claimed, error: claimError } = await supabase
    .rpc('claim_signup_code', { p_code: code.trim() })

  if (claimError || !claimed || claimed.length === 0) {
    return res.status(400).json({ error: 'Invalid, expired, or fully used invite code' })
  }

  // Create user with email already confirmed — no verification email sent
  const { error: createError } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })

  if (createError) {
    // Roll back the claimed slot so the code can be reused
    await supabase
      .from('signup_codes')
      .update({ uses: claimed[0].uses - 1 })
      .eq('code', claimed[0].code)

    if (createError.message?.toLowerCase().includes('already registered')) {
      return res.status(422).json({ error: 'An account with this email already exists' })
    }
    return res.status(422).json({ error: createError.message })
  }

  return res.status(200).json({ success: true })
}
