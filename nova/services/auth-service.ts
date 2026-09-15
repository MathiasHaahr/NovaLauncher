const http = require('http');

const AUTH_SERVER_HOST = '127.0.0.1';
const AUTH_SERVER_PORT = 8765;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: AUTH_SERVER_HOST,
      port: AUTH_SERVER_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] =
        Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData
            ? JSON.parse(responseData)
            : {};

          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          reject(
            new Error(
              `Invalid response from Nova Auth Server: ${responseData}`
            )
          );
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function checkAuthServer() {
  const response = await request('GET', '/health');

  if (response.statusCode !== 200) {
    throw new Error(
      `Nova Auth Server health check failed: HTTP ${response.statusCode}`
    );
  }

  return response.data;
}

async function startLogin() {
  console.log('[NOVA AUTH] Starting Microsoft login...');

  try {
    console.log('[NOVA AUTH] Checking auth server...');

    await checkAuthServer();

    console.log('[NOVA AUTH] Auth server is healthy');

    const startResponse =
      await request('POST', '/start');

    if (
      startResponse.statusCode !== 200 ||
      startResponse.data.status !== 'started'
    ) {
      throw new Error(
        startResponse.data.error ||
        'Failed to start Microsoft authentication'
      );
    }

    console.log(
      '[NOVA AUTH] Microsoft authentication started'
    );

    console.log(
      '[NOVA AUTH] Waiting for Microsoft login...'
    );

    const timeout = Date.now() + 10 * 60 * 1000;

    while (Date.now() < timeout) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      const statusResponse =
        await request('GET', '/status');

      if (statusResponse.statusCode !== 200) {
        throw new Error(
          statusResponse.data.error ||
          'Failed to read authentication status'
        );
      }

      const result = statusResponse.data;

      if (result.status === 'waiting') {
        continue;
      }

      if (result.status === 'success') {
        console.log(
          '[NOVA AUTH] Microsoft authentication successful'
        );

        return {
          status: 'success',
          provider: 'microsoft',
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          tokenType: result.tokenType,
          scope: result.scope
        };
      }

      if (result.status === 'error') {
        throw new Error(
          result.error ||
          'Microsoft authentication failed'
        );
      }

      if (result.status === 'expired') {
        throw new Error(
          'Microsoft authentication expired'
        );
      }
    }

    throw new Error(
      'Microsoft authentication timed out'
    );
  } catch (error) {
    console.error(
      '[NOVA AUTH] Login failed:',
      error.message
    );

    return {
      status: 'error',
      provider: 'microsoft',
      error: error.message
    };
  }
}

function cancelLogin() {
  console.log(
    '[NOVA AUTH] Cancelling Microsoft login'
  );

  return {
    status: 'cancelled'
  };
}

module.exports = {
  startLogin,
  cancelLogin
};