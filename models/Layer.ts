import FieldTypes from './FieldTypes';
import { FieldComponent } from './FieldComponent';
import { object } from 'prop-types';

const ft = new FieldTypes();


const localSymbols = {
    baseLayer : Symbol('baseLayer')
}


const registeredLayers = {
    default: {
        [ft.anyType()] : {
            baseLayer : null,
            visible : true,
            special : false,
            editable : false,
            required : false,
            bunchWrapper: (arg) => arg,
            itemWrapper: (arg) => arg,
            component: (arg) => arg,
        }
    },
    editable: {
        [ft.anyType()] : {
            baseLayer : 'default',
            editable : true,
        }
    }
};

const extractLevels = (fieldType, decl) => {
    const levels = {};
    const levelsKeys = Object.keys(decl).filter(key => key.indexOf('@') > -1);

    levelsKeys.forEach(level => {
        const levelDecl = decl[level];
        const levelKeys = Object.keys(levelDecl);
        const wildCardsNames = levelKeys.filter(key => ft.isWildcard(key));
        const typeAtLevel = levelDecl[fieldType];

        if (wildCardsNames.length || typeAtLevel) {
            const wildCards = {};
            wildCardsNames.forEach(wCardName => wildCards[wCardName] = levelDecl[wCardName]);
            levels[level.replace('@', '')] = {
                [fieldType] : typeAtLevel || null,
                wildcards : wildCardsNames.length ? wildCards : null
            };
        }
    });

    return levels;
};

export default class Layer {
    static get defaultLayer() {
        return registeredLayers.default;
    };
    static registerLayer = (name, decl = null) => Object.assign(registeredLayers, { [name] : decl });
    static getBaseLayer = (name) => registeredLayers[name] || Layer.defaultLayer;
    static extendLayer = (name, decl = {}) => registeredLayers[name] = Object.assign({}, registeredLayers[name] || {}, decl);
    static extendRegisteredLayers = (decl: { [key: string]: any }) => Object.assign(registeredLayers, decl);

    levels = {};

    fieldType: string;
    visible: boolean;
    editable: boolean;

    validator = () => true;
    component = ({}) => '';

    constructor(fieldType, decl = {}) {
        this.fieldType = fieldType;
        this.extendDecl(decl);
    }

    render() {
        return this.visible ? this.component :  null;
    }

    get baseLayer() {
        return this[localSymbols.baseLayer]
            ? Layer.getBaseLayer(this[localSymbols.baseLayer])
            : Layer.defaultLayer;
    };

    set baseLayer(layerName) {
        this[localSymbols.baseLayer] = layerName ? layerName : null;
    };

    private getExtendedByBaseChain(type, base) {
        let localBase = base;
        if (typeof base === 'string') {
            localBase = Layer.getBaseLayer(base);
        }
console.log(type);

        let baseForType = localBase[type] || {};
        if (baseForType.baseLayer) {
            console.log('baseForType.baseLayer');
            console.log(baseForType.baseLayer);

            baseForType = this.getExtendedByBaseChain(type, baseForType);
        }
        let baseForAny = localBase[ft.anyType()] || {};
        if (baseForAny.baseLayer) {
            console.log('baseForAny.baseLayer');
            console.log(baseForAny.baseLayer);
            baseForAny = this.getExtendedByBaseChain(type, baseForAny);
        }

        return Object.assign({}, baseForAny, baseForType);
    }

    private extendLevels() {
        console.log('extend levels');

        const levelNames = Object.keys(this.levels);
        levelNames.forEach(levelName => {
            const base = this.getExtendedByBaseChain(this.fieldType, Layer.getBaseLayer(levelName) || {});

            const typeDecl = this.levels[levelName][this.fieldType] || {};
            this.levels[levelName] = Object.assign(base, this.levels[levelName], typeDecl);
            // delete this.levels[levelName][this.fieldType];
            // if (this.levels[levelName].baseLayer) {
            //     delete this.levels[levelName].baseLayer;
            // }
        });
    }

    extendDecl(decl) {
        const fieldDecl = decl[this.fieldType] || {};
        this.baseLayer = fieldDecl.baseLayer;

        this.levels = this.extractLevels(this.fieldType, decl);
        this.extendLevels();

        const base = this.getExtendedByBaseChain(this.fieldType, this.baseLayer);

        Object.assign(this, base, fieldDecl);
    }

    applyLevel(levelName) {
        return this.levels[levelName]
            ? Object.assign({}, this, this.levels[levelName])
            : this;
    }

    private extractLevels = extractLevels;
}
