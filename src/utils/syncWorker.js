class SyncWorker {
  constructor(cloudEndpoint, syncInterval = 10000) {
    this.cloudEndpoint = cloudEndpoint;
    this.syncInterval = syncInterval;
    this.isSyncing = false;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.processQueue(), this.syncInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  saveOfflinePayload(payload) {
    const queue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
    queue.push({ ...payload, timestamp: Date.now() });
    localStorage.setItem('offline_sync_queue', JSON.stringify(queue));
  }

  async processQueue() {
    if (this.isSyncing) return;
    const queue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
    if (queue.length === 0) return;

    this.isSyncing = true;
    try {
      const response = await fetch(${this.cloudEndpoint}/api/sync, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queue })
      });

      if (response.ok) {
        localStorage.setItem('offline_sync_queue', JSON.stringify([]));
      }
    } catch (error) {
      console.warn('Sync deferred: Network unavailable.');
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncWorker = new SyncWorker('https://your-cloud-relay-endpoint.com');
