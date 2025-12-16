import type { Worker } from 'node:worker_threads'
export type WorkerEventData = {
    eventName: string;
    workerId: number;
    worker: Worker;

} 