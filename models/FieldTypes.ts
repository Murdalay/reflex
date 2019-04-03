import ModelRef from './ModelRef';
import FieldGroup from './FieldGroup';
import { ReflexSchema } from './ReflexSchema';
let that: FieldTypes = null;


const typesList = {
    ID: 'id',
    SEMANTIC_ID: 'semanticId',
    NAME: 'name',
    TITLE: 'title',
    CREATED: 'created',
    GROUP: 'group',
    MODEL_REF: 'modelRef',
    MODEL_REF_LIST: 'modelRefList',
    STRING_LIST: 'stringList',
    SHIRT_STRING: 'shirtString',
    LONG_STRING: 'longString',
    BOOL: 'longString',
    DATE_FORMATED: 'dateFormated',
    DATE_UNIX: 'dateUnix',
    EMAIL: 'eMail',
    MD_LAYOUT: 'mdLayout',
    IMAGE_URL: 'imageUrl',
    LINK_URL: 'linkUrl',
    FILE_URL: 'fileUrl',
    ANY_TYPE: '*',
};

export default class FieldTypes {

    // DO NOT REDEFINE TYPES AT THE CLASS LEVEL!!!
    constructor(extendTypes? : {[key: string]: string}) {
        if (!that) {
            that = this;
            this.registerTypes();
        }
        if (extendTypes) {
            this.static.extendTypes(extendTypes);
            this.registerTypes();
        }

        return that;
    }

    static extendTypes(extendTypes = {}) {
        this.typesList = Object.assign({}, this.typesList, extendTypes);
    }
    static typesList: {[key: string]: string} = typesList;

    get wildcards(): string[] {
        return [this.static.typesList.ANY_TYPE];
    }

    registerTypes() {
        Object.assign(this, this.static.typesList);;
    }

    // types helpers
    anyType() {
        return this.static.typesList.ANY_TYPE;
    }

    isWildcard = (arg: string): boolean => this.wildcards.includes(arg);

    getUniqueTypes = () => this.static.typesList.unque;
    getSpecialTypes = () => this.static.typesList.special;
    getWildcards = () => this.wildcards;

    [Symbol.iterator] = function* () {
        const keys = Object.keys(this.static.typesList);
        for (const key of keys) {
            yield this.static.typesList[key];
        }
    };

    // models and groups helpers
    hasOne(modelName: string, layer = {}): ModelRef {
        return new ModelRef({ refType: ModelRef.getHasOneToken(), modelName, layer });
    }

    hasMany(modelName: string, layer = {}): ModelRef {
        return new ModelRef({ refType: ModelRef.getHasManyToken(), modelName, layer });
    }

    fk(modelName: string, layer = {}): ModelRef {
        return new ModelRef({ refType: ModelRef.getFkToken(), modelName, layer });
    }

    group(groupName: string, fields: ReflexSchema, layer = {}): FieldGroup {
        return new FieldGroup({ groupName, fields, layer });
    }

    // mimic array methods
    forEach = (...rest) => {
        return Array.prototype.forEach.apply(Array.from(this), rest);
    }
    map(...rest) {
        return Array.prototype.map.apply(Array.from(this), rest);
    }
    includes(...rest): any[] {
        return Array.prototype.includes.apply(Array.from(this), rest);
    }
    get length() {
        return Array.from(this).length;
    }
    get static() {
        return <typeof FieldTypes>this.constructor;
    }
    [key: string]: any;
}
