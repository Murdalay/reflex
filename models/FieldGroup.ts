import { ReflexSchema } from './ReflexSchema';

export default class FieldGroup {
    groupName: string;
    fields: ReflexSchema;
    layer: Object;

    constructor({ groupName, fields, layer = {} }) {
        this.groupName = groupName;
        this.fields = fields;
        this.layer = layer;
    }
}
