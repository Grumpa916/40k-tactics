// Mount local play immediately. A slow optional cloud SDK must not block the app.
export function startLiveApp({ mount, loadCloud, onCloudError = () => {}, timeoutMs = 8000 }) {
  const shell = mount();
  let connecting = null;
  function connect() {
    if (connecting) return connecting;
    let timer;
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Cloud connection timed out')), timeoutMs); });
    connecting = Promise.race([Promise.resolve().then(loadCloud), deadline]).then(client => {
      if (client) shell.connectCloud?.(client);
      return client;
    }).catch(error => { onCloudError(error); return null; }).finally(() => {
      clearTimeout(timer); connecting = null;
    });
    return connecting;
  }
  return { shell, cloudReady: connect(), retryCloud: connect };
}
