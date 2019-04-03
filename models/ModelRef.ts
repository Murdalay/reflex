
export default class ModelRef {
    static HAS_MANY = 'HAS_MANY';
    static HAS_ONE = 'HAS_ONE';
    static FOREIGN_KEY = 'FOREIGN_KEY';

    modelName: string;
    refType: string;
    layer: Object;

    constructor({ refType, modelName, layer = {} }) {
        this.modelName = modelName;
        this.refType = refType;
        this.layer = layer;
    }

    static getHasOneToken(): string {
        return this.HAS_ONE;
    }

    static getHasManyToken(): string {
        return this.HAS_MANY;
    }

    static getFkToken(): string {
        return this.FOREIGN_KEY;
    }
}

export function isModelRef(arg: any): arg is ModelRef {
    return (<ModelRef>arg) instanceof ModelRef;
 }
