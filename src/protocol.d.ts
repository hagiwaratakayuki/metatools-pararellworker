import type { Worker } from 'node:worker_threads'
import type Controller from './controller.js'


export type ControllerConstructorParameters = ConstructorParameters<typeof Controller>[number]
export type WorkerData = {
    workerId: number;
    worker: Worker;

}


export type WorkerEventMap = {
    "error": (err: Error, data?: WorkerData) => void;
    "exit": (exitCode: number, data: WorkerData) => void;
    "messageerror": (error: Error, data: WorkerData) => void;
    "online": (WorkerData) => void;
}
export type ProtocolMapToEventMap<EventMapT extends object> = {
    [k in keyof EventMapT]: (data: EventMapT[k], id: number) => void;
}



