const fs = require('fs');
const auth = require('../services/auth-service');
const adapter = {
  initialize: async () => {
    try {
      const env = fs.readFileSync('launcher/nova/config/.env', 'utf8');
      if (env.includes('NOVA_MICROSOFT_CLIENT_ID')) return { status: 'ready' };
    } catch (e) {}
    return { status: 'blocked', error: 'XMCL runtime requires Microsoft client configuration' };
  },
  getRuntimeStatus: async () => 'ready',
  getAccounts: async () => [],
  getActiveAccount: async () => null,
  loginMicrosoft: async () => {
    console.log('[NOVA AUTH] adapter.loginMicrosoft called');
    return auth.startLogin();
  },
  logout: async (id) => ({ status: 'not_implemented' }),
  setActiveAccount: async (id) => ({ status: 'not_implemented' })
};
module.exports = { adapter };