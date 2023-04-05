# @Metatools/Pararellworker

 easy to use worker threads for parallel processing. With this library, you can implement parallel processing in a straightforward manner.


## Install

```bash
npm install @meatatools/parallworker
```

## Usage

```javascript
import {Controller} = from '@metatools-pararellworker';
const consrollerForProjectroot = new Controller('/workerpath/from/projectroot', workerNumber, workerOptions,  emitterOptions) 


consrollerForProjectroot.broadcast('broadcast event', 'this is broadcast!')
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const controllerForRealtivePath  = new Controller(['./relative/for/worker.js', __dirname], workerNumber, workerOptions,  emitterOptions)

controllerForRealtivePath.message('singlemessage', )
```


```javascript
// worker
import {Worker} = from '@metatools-pararellworker';


worker.on('brodcast', function(message){
    
    worker.postMessage('response', 'hello');

})


worker.postInit('done');

```

## API

### Event System

Controller and Worker is extend EventEmitter. Both post and accept message with event name.


if want  more, see docs directry

   













