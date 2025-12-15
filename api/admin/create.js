let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (e) {
  // Vercel build will install deps; runtime check guards missing module locally
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }
  try {
    const adminSecret = process.env.ADMIN_CREATE_SECRET || '';
    const secretHeader = req.headers['x-admin-secret'] || '';
    if (!adminSecret || secretHeader !== adminSecret) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }

    const { email, password } = (req.body && typeof req.body === 'object') ? req.body : {};
    if (!email || !password) {
      res.status(400).json({ ok: false, error: 'Missing email or password' });
      return;
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
      return;
    }
    if (!createClient) {
      res.status(500).json({ ok: false, error: 'Server missing @supabase/supabase-js dependency' });
      return;
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    const userId = (data && (data.user?.id || data.id)) || null;
    if (!userId) {
      res.status(500).json({ ok: false, error: 'User creation returned no id' });
      return;
    }

    const { error: profileErr } = await adminClient
      .from('profiles')
      .insert([{ id: userId, role: 'admin' }]);
    if (profileErr) throw profileErr;

    res.status(200).json({ ok: true, userId });
  } catch (err) {
    console.error('Admin create error:', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

