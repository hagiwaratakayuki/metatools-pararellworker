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

// handler utrity
export type PromisableVoid = Promise<void> | void;
export type noArgHandler = () => PromisableVoid
export type idOnlyHandler = (id: number) => PromisableVoid
export type dataOnlyHandler<DataT> = (data: DataT) => PromisableVoid
export type dataWithIdHandler<DataT> = (data: DataT, id: number) => PromisableVoid
export type argSwitch<DataT> = DataT extends null | undefined ? noArgHandler | idOnlyHandler : dataOnlyHandler<DataT> | dataWithIdHandler<DataT>

export type ProtocolMapToEventMap<ProtocolMapT extends object> = {
    [k in keyof ProtocolMapT]: argSwitch<ProtocolMapT[k]>
}



