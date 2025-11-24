
class Template {
    constructor() {
        this._datas = {};
    }
    toJSON() {
        return this._datas;
    }
    get(key) {
        return this._datas[key];
    }

    set(key, value) {
        const func = this._getCollisionFunc(key);
        this._datas[key] = func(value, this._datas[key])


    }
    setMulti(keyValues) {
        for (const [key, value] of Object.entries(keyValues)) {
            this.set(key, value);
        }

    }
    _getCollisionFunc(key) {
        throw new Error("getCollision does not implemented")

    }

}
class SingleCollisionFunc extends Template {
    constructor(collisionFunc) {
        super();
        if (collisionFunc) {
            this.setCollisionFunc(collisionFunc)

        }



    }
    _getCollisionFunc() {
        return this._collisionFunc;
    }
    setCollisionFunc(collisionFunc) {
        this._collisionFunc = collisionFunc
    }
}

class MultiCollisionFunc extends Template {
    constructor(collisionMap) {

        super()
        this.setCollisionMap({} || collisionMap);


    }
    setCollisionMap(collisionMap) {
        for (const [key, func] of Object.entries(collisionMap)) {
            this.setCollisionFunc(key, func);
        }

    }
    setCollisionFunc(key, func) {
        this._collisionMap[key] = func
    }
    _getCollisionFunc(key) {
        if (key in this._collisionMap) {
            return this.collisionMap[key];

        }
        throw new Error("no collisuon func")

    }


}

module.exports = { SingleCollisionFunc, MultiCollisionFunc, Template }