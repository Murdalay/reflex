import { ReflexSchema } from './ReflexSchema';
import { ReflexModel } from './ReflexModel';
import { Model } from 'redux-orm';
import { createSelector } from 'redux-orm';

export interface ReflexSelectionArgument {
    fields: string[],
    id?: string | number,
    ids?: string[] | number[]
};


export class ReflexSelection<T extends ReflexModel> {

    static reducerName: string;

    private static get dbStateSelector() {
        return state => state[this.reducerName];
    }

    groupName: string;
    fields: string[];
    id: string | number;
    ids: Array<string | number> = [];
    reflexInstance: T;
    private extraProps: { [key: string]: any } = {};

    get all() {
        this.allInstances = true;
        this.ids = [];
        return this;
    }
    private allInstances = false;
    private wrapp = (arg) => arg;

    constructor(instance: T, { fields, id = null, ids = [] }: ReflexSelectionArgument) {
        this.reflexInstance = instance;
        this.id = id;
        this.ids = ids;
        this.fields = fields;
    }


    setWrapper(wrapper) {
        this.wrapp = wrapper;
    }

    render(extraProps?: { [key: string]: any }): Function {
        if (extraProps) {
            this.setExtraProps(extraProps)
        }
        return this.reflexInstance.render(this);
    }

    setExtraProps(extraProps: { [key: string]: any }) {
        this.extraProps = Object.assign({}, this.extraProps, extraProps);;
    }

    createSelector() {
        return createSelector(
            this.reflexInstance.static.orm,
            this.static.dbStateSelector,
            session => {
                const CurrentModel = session[this.reflexInstance.modelName];
                let query: any[] = this.allInstances
                    ? CurrentModel.all().toModelArray()
                    : this.id
                        ? CurrentModel.withId(this.id).toModelArray()
                        : CurrentModel.all().toModelArray();
                if (this.ids && this.ids.length && Array.isArray(query)) {
                    query = query.filter((item: { id: number | string }) => this.ids.includes(item.id));
                }

                return {
                    fields: this.fields,
                    model: this.reflexInstance,
                    data: query.map(instance => {
                        const relatedFields = {};
                        const fieldsObject = this.fields.reduce((acc, field) => {
                            acc[field] = instance.ref[field];
                            return acc;
                        }, {});
                        const relatedModelDescriptors = this.reflexInstance.extractRelatedModelFields();

                        relatedModelDescriptors
                            .filter(dscr => this.fields.includes(dscr.name))
                            .forEach(dscr => relatedFields[dscr.name] = instance[dscr.name]
                                ? instance[dscr.name].toRefArray
                                    ? instance[dscr.name].toRefArray()
                                    : instance[dscr.name].ref
                                : null);

                        return this.extendConnectedProps(Object.assign({}, fieldsObject, relatedFields));
                    })
                };
            }
        );
    }

    private extendConnectedProps(props: Object): Object {
        return Object.assign(props, this.extraProps);
    }
    get static() {
        return <typeof ReflexSelection>this.constructor;
    }
}
