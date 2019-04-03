import FieldTypes from './FieldTypes';
import ModelRef, { isModelRef } from './ModelRef';
import Layer from './Layer';
import DataBaseFactory from './ReflexDB';
import { ORM } from 'redux-orm';
import { ReflexSchema } from './ReflexSchema';
import { ReflexSelection, ReflexSelectionArgument } from './ReflexSelection';
import FieldGroup from './FieldGroup';
const ft = new FieldTypes();
import { ReflexSchemaField } from './ReflexSchemaField';
import { createReducer } from 'redux-orm';
import { FieldDescriptor } from './FieldDescriptor';

const registeredModels = {};


export class ReflexModel {

    static _modelName: string = null;
    static _Schema: ReflexSchema = {};
    static Declaration = {};
    static relatedModels: string[] = [];
    static transformedSchema: {[key: string]: FieldDescriptor } = {};
    static registeredTypes: {[key: string]: Layer} = {};
    static connect: Function;
    static orm = new ORM();

    private static _reducerName = 'db';

    static get reducerName() {
        ReflexSelection.reducerName = this._reducerName;
        return this._reducerName;
    }
    static set reducerName(value: string) {
        this._reducerName = value;
        ReflexSelection.reducerName = value;
    }

    static registerConnectFunction(connect: Function) {
        this.connect = connect;
    }
    static createReducer() {
        return createReducer(this.orm);
    }

    static getFieldDescriptorForSchemaField(fieldName: string, schemaField: ReflexSchemaField, typesRegister: {[key: string]: Layer}) {
        const fieldDescriptor: Partial<FieldDescriptor> = {
            path: fieldName,
            name: this.getFieldName(fieldName)
        };

        if (isModelRef(schemaField)) {
            this.relatedModels.push(schemaField.modelName);
            fieldDescriptor.relatedModel = schemaField.modelName;
            fieldDescriptor.modelRef = fieldName;
            fieldDescriptor.type = ft.MODEL_REF;
        } else if (typeof schemaField === 'string') {
            fieldDescriptor.type = schemaField;
            typesRegister[fieldDescriptor.type] = new Layer(fieldDescriptor.type, this.Declaration);
        } else {
            fieldDescriptor.type = ft.GROUP;
            const groupFieldNames = Object.keys(schemaField.fields);
            fieldDescriptor.groupFields = groupFieldNames.map(groupField =>
                this.getFieldDescriptorForSchemaField(groupField, schemaField.fields[groupField], typesRegister)
            );
        }

        return fieldDescriptor as FieldDescriptor;
    }

    static getDBModel() {
        const SelectionModel: any = DataBaseFactory(this.modelName);
        SelectionModel.modelName = this.modelName;
        SelectionModel.fields = SelectionModel.convertSchemaToFields(this.Schema);

        return SelectionModel;
    }

    static getModel(modelName) {
        return registeredModels[modelName];
    }
    static transformSchema(schema = this.Schema, fieldsDeclaration = this.transformedSchema, typeRegister = this.registeredTypes) {
        const fields = Object.keys(schema);

        fields.forEach(field => {
            const current: ReflexSchemaField = schema[field];
            const fieldDescriptor = this.getFieldDescriptorForSchemaField(field, current, typeRegister);

            fieldsDeclaration[field] = fieldDescriptor;
        });
    }
    static registerModels(...Models) {
        Models.forEach(Model => registeredModels[Model.modelName] = Model);
        const ormModels = Models.map(Model => Model.getDBModel());
        this.orm.register(...ormModels);
    }
    static extendRegisteredLayers(decl) {
        Layer.extendRegisteredLayers(decl);
    }
    static getFieldName(path) {
        return this.nameProvider(this.modelName, path);
    }
    // allows to connect external translation and name storage
    static nameProvider(name, path) {
        return path;
    }
    static set modelName(modelName) {
        this._modelName = modelName;
    };
    static get modelName(): string {
        return this._modelName;
    };
    static get Schema(): ReflexSchema {
        return this._Schema;
    };
    static set Schema(val) {
        this._Schema = val;
        this.transformSchema();
        this.relatedModels = Array.from(new Set(this.relatedModels));
    };

    // instance methods and fields
    localLevel: string;
    registeredTypes: {[key: string]: Layer} = {};
    relatedModels: string[] = [];
    transformedSchema: {[key: string]: FieldDescriptor } = {};
    modelName: string;
    Declaration: Object;


    constructor(local: Object | string) {
        this.modelName = this.static.modelName;
        this.registeredTypes = this.static.registeredTypes;
        this.relatedModels = this.static.relatedModels;
        this.transformedSchema = this.static.transformedSchema;
        this.Declaration = this.static.Declaration;

        if (typeof local === 'string') {
            this.localLevel = local;
        } else {
            Object.assign(this.Declaration, local);
            this.static.transformSchema.bind(this)();
        }
    }

    selection(dsc: ReflexSelectionArgument): ReflexSelection<this> {
        return new ReflexSelection(this, dsc);
    }

    extractRelatedModelFields(): FieldDescriptor[] {
        const keys = Object.keys(this.transformedSchema);
        return keys
            .filter(key => this.transformedSchema[key].type === ft.MODEL_REF)
            .map(key => this.transformedSchema[key]);
    }

    controller(props): Function {
        console.log(props);

        return () => {};
    }

    render(selection: ReflexSelection<this>) {
        return this.static.connect(selection.createSelector(), null)(this.controller);
    }

    get all() {
        return this.selection({ fields: Object.keys(this.static.Schema) });
    }

    get static() {
        return <typeof ReflexModel>this.constructor;
    }
}
