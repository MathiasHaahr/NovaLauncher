console.log('[NOVA RENDERER] Loaded');

async function initializeNova() {
  console.log('[NOVA RENDERER] novaAPI:', window.novaAPI);

  if (!window.novaAPI) {
    console.error('[NOVA RENDERER] novaAPI is missing');
    return;
  }

  try {
    const status = await window.novaAPI.runtimeStatus();

    console.log('[NOVA RENDERER] Runtime status:', status);

    const statusElement = document.getElementById('status');

    if (statusElement) {
      statusElement.textContent =
        typeof status === 'string'
          ? status
          : JSON.stringify(status);
    }
  } catch (error) {
    console.error(
      '[NOVA RENDERER] Failed to get runtime status:',
      error
    );
  }

  const loginButton =
    document.getElementById('loginButton');

  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      console.log('[NOVA RENDERER] Login clicked');

      try {
        const result =
          await window.novaAPI.accounts.login();

        console.log(
          '[NOVA RENDERER] Login result:',
          result
        );
      } catch (error) {
        console.error(
          '[NOVA RENDERER] Login failed:',
          error
        );
      }
    });
  }
}

window.addEventListener(
  'DOMContentLoaded',
  initializeNova
);