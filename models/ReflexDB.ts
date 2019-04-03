import {fk, many, attr, oneToOne, Model} from 'redux-orm';
import {toArray} from '../util/objectHelpers.js';
import ModelRef from './ModelRef';

const relationHandlers = {
    [ModelRef.getHasOneToken()]: oneToOne,
    [ModelRef.getHasManyToken()]: many,
    [ModelRef.getFkToken()]: fk,
}

declare interface ActionsObject {
    create: StatusObject;
    read: StatusObject;
    update: StatusObject;
    delete: StatusObject;
    list: StatusObject;
}

declare interface StatusObject {
    success: (data: { [key: string]: any }) => { type: string, data: { [key: string]: any }};
    error: (data: { [key: string]: any }) => { type: string, data: { [key: string]: any }};
    start: (data: { [key: string]: any }) => { type: string, data: { [key: string]: any }};
    requested: (data: { [key: string]: any }) => { type: string, data: { [key: string]: any }};
}

declare interface StatusTypesObject {
    success: string;
    error: string;
    start: string;
    requested: string;
};

declare interface ActionTypesObject {
    create: StatusTypesObject;
    read: StatusTypesObject;
    update: StatusTypesObject;
    delete: StatusTypesObject;
    list: StatusTypesObject;
}

class ReflexDB extends Model {

    static modelName: string;

    static STATUS = {
        SUCCESS : 'SUCCESS',
        ERROR : 'ERROR',
        START : 'START',
        REQUESTED : 'REQUESTED',
    };
    static ACTIONS = {
        CREATE : 'CREATE',
        READ : 'READ',
        UPDATE : 'UPDATE',
        DELETE : 'DELETE',
        LIST : 'LIST',
    };

    static getActionCreatorFuncForTheAction(actionName) {
        return (status) => (data = {}) => ({ type: this.actionTypes[actionName][status], data });
    }

    static get actions(): ActionsObject {
        const actions = {};
        const actionGetters = Object.keys(this.ACTIONS).reduce((acc, name) => {
            const creatorFunction = this.getActionCreatorFuncForTheAction(name);
            acc[name.toLowerCase()] = { get: () => {
                const statuses = {};
                const statusGetters = Object.keys(this.ACTIONS).reduce((accum, status) => {
                    accum[status.toLowerCase()] = { get: creatorFunction(status) }
                    return accum;
                }, {});
                Object.defineProperties(statuses, statusGetters);
                return statuses as StatusObject;
            } };
            return acc;
        }, {});
        Object.defineProperties(actions, actionGetters);

        return actions as ActionsObject;
    }

    static get actionTypes(): ActionTypesObject {
        const actions = {};
        const actionGetters = Object.keys(this.ACTIONS).reduce((acc, name) => {
            acc[name.toLowerCase()] = { get: () => {
                const statuses = {};
                const statusGetters = Object.keys(this.ACTIONS).reduce((accum, status) => {
                    accum[status.toLowerCase()] = { get: () => `${name}_${this.modelName}_${status}` }
                    return accum;
                }, {});
                Object.defineProperties(statuses, statusGetters);
                return statuses as StatusTypesObject;
            } };
            return acc;
        }, {});
        Object.defineProperties(actions, actionGetters);

        return actions as ActionTypesObject;
    }

    static convertSchemaToFields(schema) {
        const fieldNames = Object.keys(schema);
        const fields = {};
        fieldNames.forEach(fieldName => {
            const fieldDecl = schema[fieldName];
            fields[fieldName] = fieldDecl instanceof ModelRef
                ? relationHandlers[fieldDecl.refType](fieldDecl.modelName)
                : attr();
            console.log(fields);

        });
        return fields;
    }

    static reducer(action, Model, session) {
        const modelName = this.modelName.toUpperCase();

        switch (action.type) {
        // TODO: remove FETCH_${modelName}S_SUCCEEDED
        case `FETCH_${modelName}S_SUCCEEDED` || this.actionTypes.list.success: {
            const keys = Object.keys(action.data);

            toArray(action.data).forEach((elem, index) => {
                const key = keys[index];
                if (elem.id === undefined) {
                    // preserving numeral id's
                    elem.id = key === parseInt(key) + ''
                        ? parseInt(key)
                        : key;
                }
                Model.create(elem);
            });
            break;
        }
        case this.actionTypes.read.success:
            Model.create(action.data);
            break;
        case this.actionTypes.create.success:
            Model.create(action.data);
            break;
        case this.actionTypes.update.success:
            Model.withId(action.id).update(action.data);
            break;
        case this.actionTypes.delete.success:
            const instance = Model.withId(action.id);
            instance.delete();
            break;
        }
    }
}

const DataBaseFactory = (name: string) => ({[name] : class extends ReflexDB {}})[name];

export default DataBaseFactory;