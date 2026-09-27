(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const state = { wakeLock: null, recorder: null, stream: null, chunks: [], recordingStartedAt: null };

  const capabilities = {
    camera: Boolean(navigator.mediaDevices?.getUserMedia),
    audioRecording: Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
    barcode: Boolean(window.BarcodeDetector),
    geolocation: Boolean(navigator.geolocation),
    wakeLock: Boolean(navigator.wakeLock),
    share: Boolean(navigator.share),
    shareFiles: Boolean(navigator.canShare),
    badge: Boolean(navigator.setAppBadge),
    launchQueue: Boolean(window.launchQueue),
    fileSystem: Boolean(window.showOpenFilePicker || window.showSaveFilePicker),
    vibration: Boolean(navigator.vibrate)
  };

  async function requestWakeLock() {
    if (!capabilities.wakeLock || state.wakeLock) return state.wakeLock;
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => { state.wakeLock = null; emit('workcore:wake-lock', { active: false }); });
      emit('workcore:wake-lock', { active: true });
      return state.wakeLock;
    } catch (error) { emit('workcore:device-error', { capability: 'wakeLock', error }); return null; }
  }

  async function releaseWakeLock() {
    if (!state.wakeLock) return;
    await state.wakeLock.release().catch(() => {});
    state.wakeLock = null;
  }

  function getLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!capabilities.geolocation) return reject(new Error('Location is not supported on this device.'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: options.enableHighAccuracy !== false,
        timeout: options.timeout || 15000,
        maximumAge: options.maximumAge || 60000
      });
    }).then(position => ({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy_m: position.coords.accuracy,
      altitude_m: position.coords.altitude,
      heading: position.coords.heading,
      speed_mps: position.coords.speed,
      captured_at: new Date(position.timestamp).toISOString()
    }));
  }

  async function startVoiceRecording(options = {}) {
    if (!capabilities.audioRecording) throw new Error('Voice recording is not supported on this device.');
    if (state.recorder?.state === 'recording') throw new Error('A recording is already in progress.');
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported?.(type));
    state.chunks = [];
    state.recorder = new MediaRecorder(state.stream, mimeType ? { mimeType } : undefined);
    state.recorder.ondataavailable = event => { if (event.data?.size) state.chunks.push(event.data); };
    state.recordingStartedAt = Date.now();
    state.recorder.start(options.timeslice || 1000);
    await requestWakeLock();
    capabilities.vibration && navigator.vibrate(35);
    emit('workcore:voice-started', { mimeType: state.recorder.mimeType });
    return { mimeType: state.recorder.mimeType };
  }

  async function stopVoiceRecording() {
    if (!state.recorder || state.recorder.state === 'inactive') throw new Error('No voice recording is active.');
    const recorder = state.recorder;
    const blob = await new Promise((resolve, reject) => {
      recorder.addEventListener('stop', () => resolve(new Blob(state.chunks, { type: recorder.mimeType || 'audio/webm' })), { once: true });
      recorder.addEventListener('error', event => reject(event.error || new Error('Recording failed.')), { once: true });
      recorder.stop();
    });
    state.stream?.getTracks().forEach(track => track.stop());
    const durationMs = Date.now() - state.recordingStartedAt;
    state.recorder = null; state.stream = null; state.chunks = []; state.recordingStartedAt = null;
    await releaseWakeLock();
    capabilities.vibration && navigator.vibrate([25, 40, 25]);
    const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([blob], `voice-note-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`, { type: blob.type, lastModified: Date.now() });
    emit('workcore:voice-stopped', { file, duration_ms: durationMs });
    return { file, duration_ms: durationMs };
  }

  async function cancelVoiceRecording() {
    if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
    state.stream?.getTracks().forEach(track => track.stop());
    state.recorder = null; state.stream = null; state.chunks = []; state.recordingStartedAt = null;
    await releaseWakeLock();
    emit('workcore:voice-cancelled');
  }

  async function scanImage(file, formats = ['qr_code', 'code_128', 'ean_13', 'ean_8', 'data_matrix']) {
    if (!capabilities.barcode) throw new Error('Native QR/barcode detection is unavailable. Use the camera and enter the code manually.');
    const bitmap = await createImageBitmap(file);
    try {
      const supported = await BarcodeDetector.getSupportedFormats?.();
      const selected = supported ? formats.filter(format => supported.includes(format)) : formats;
      const detector = new BarcodeDetector({ formats: selected.length ? selected : undefined });
      const results = await detector.detect(bitmap);
      emit('workcore:codes-detected', { results });
      return results.map(result => ({ raw_value: result.rawValue, format: result.format, corner_points: result.cornerPoints || [] }));
    } finally { bitmap.close?.(); }
  }

  async function share(data) {
    if (!capabilities.share) throw new Error('System sharing is not supported.');
    const payload = { title: data.title, text: data.text, url: data.url };
    if (data.files?.length && navigator.canShare?.({ files: data.files })) payload.files = data.files;
    await navigator.share(payload);
  }

  async function setBadge(count) {
    if (!capabilities.badge) return;
    if (Number(count) > 0) await navigator.setAppBadge(Number(count)).catch(() => {});
    else await navigator.clearAppBadge?.().catch(() => {});
  }

  function registerLaunchConsumer() {
    if (!window.launchQueue?.setConsumer) return;
    window.launchQueue.setConsumer(async launchParams => {
      const files = [];
      for (const handle of launchParams.files || []) {
        try { files.push(await handle.getFile()); } catch (_) {}
      }
      if (files.length) emit('workcore:shared-files', { files, source: 'file-handler' });
      if (launchParams.targetURL) emit('workcore:launch-url', { url: launchParams.targetURL });
    });
  }

  window.addEventListener('workcore:pending-changed', event => setBadge(event.detail?.count || 0));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.wakeLock) requestWakeLock();
  });
  registerLaunchConsumer();

  root.device = { capabilities, state, requestWakeLock, releaseWakeLock, getLocation, startVoiceRecording, stopVoiceRecording, cancelVoiceRecording, scanImage, share, setBadge };
  emit('workcore:device-ready', { capabilities });
})();
