import type { Worker } from 'node:worker_threads'
import type Controller from './controller.js'


export type ControllerConstructorParameters = ConstructorParameters<typeof Controller>[number]
export type WorkerData = {
    workerId: number;
    worker: Worker;

}


export type WorkerEventMap = {
    "error": (data: WorkerData, err: Error) => void;
    "exit": (data: WorkerData, exitCode: number) => void;
    "messageerror": (data: WorkerData, error: Error) => void;
    "online": (data: WorkerData) => void;
}
export type ProtocolMapToEventMap<EventMapT extends object> = {
    [k in keyof EventMapT]: (data: EventMapT[k], id: number) => void;
}



