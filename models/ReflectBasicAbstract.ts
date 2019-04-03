
declare interface ReflexBasicAbstractArgument<M> {
    name: string;
    metadata?: M;
    baseId?: string;
};

declare interface genericHashMap<T> {
    [key: string]: T;
}


declare interface GenericTokenProvider<D, M> {
    name: string;

    create?(decl: D): M;
    decode?(token: M): D;
};

declare interface GenericDataStorage<M, T> {
    path: string;
    tokenProvider: GenericTokenProvider<any, any>;

    store(item: M);
    get(path: string): M;
    update?(path: string, data: Partial<M>);
    remove?(M);
};


class IdProvider implements GenericTokenProvider<string, string> {
    name: 'IdProvider';
    nameSpace = '';

    create(path: string): string {
        return `${this.nameSpace}${path}${Date.now()}`;
    };

    constructor(nameSpace: string) {
        this.nameSpace = nameSpace;
    }

}

class InstanceProvider<T extends { id : string }> implements GenericDataStorage<T, IdProvider> {
    path: string;
    tokenProvider = new IdProvider(this.path);

    constructor(path: string) {
        this.path = path;
    }

    private idStorage: genericHashMap<genericHashMap<T>> = {};


    get(id: string) {
        return this.idStorage[this.path][id];
    };
    store (instance: T) {
        if (!this.idStorage[this.path]) {
            this.idStorage[this.path] = {};
        }
        this.idStorage[this.path][instance.id] = instance;
    };
    remove (id: string) {
        if (this.idStorage[this.path] && this.idStorage[this.path][id]) {
            delete this.idStorage[this.path][id];
        }
    };

}




export default abstract class ReflexBasicAbstract<T extends ReflexBasicAbstract<T, M>, M> {
    // Static fields
    private static _modelName: string;
    static get modelName(): string {
        return ReflexBasicAbstract._modelName;
    }
    static set modelName(value: string) {
        this.idProvider = new IdProvider(value);
        this.instanceProvider == new InstanceProvider(value);
        ReflexBasicAbstract._modelName = value;
    }

    static Declaration = {};
    static idProvider: IdProvider = new IdProvider('');
    static instanceProvider: InstanceProvider<any>;


    private static actionCallbacks: WeakMap<ReflexBasicAbstract<any, any>, genericHashMap<Function[]>> = new WeakMap();


    // Abstract methods
    protected abstract getBaseInstance():T;


    abstract getMetadata(): M;
    abstract onError(err: Error);
    abstract destroy();

    // Instance fields
    protected id: string;
    protected name: string;
    protected baseId: string;
    protected metadat: M;

    // provides an access to static class members
    get static() {
        return <typeof ReflexBasicAbstract>this.constructor;
    }

    // Instance methods
    protected destructor() {
        this.static.instanceProvider.remove(this.id);
        this.emit('delete');
    };

    subscribe(action: string, cb: Function) {
        const actionsHash = this.static.actionCallbacks.get(this) || {};
        actionsHash[action] = actionsHash[action] ? [...actionsHash[action], cb] : [cb];
    };

    emit(action: string, payload?: any) {
        const subscribersArray = (this.static.actionCallbacks.get(this) || {})[action];
        subscribersArray.forEach(cb => cb({ payload, id: this.id }));
    };


    constructor({ name, baseId, metadata = {} as M }: ReflexBasicAbstractArgument<M>) {
        try {
            this.name = name;
            this.id = this.static.idProvider.create(name);
            this.static.instanceProvider.store(this);
            this.baseId = baseId === void 0 ? baseId : null;
        } catch(e) {
            this.onError(e);
        }
    }
}


export class BasicMetaType<Q> extends ReflexBasicAbstract<BasicMetaType<Q>, Q> implements ReflexBasicAbstract<BasicMetaType<Q>, Q> {

    constructor(arg: ReflexBasicAbstractArgument<Q>) {
        super(arg);
        this.updateMetadata(arg.metadata);
    }

    protected  getBaseInstance(): BasicMetaType<Q> {
        return this.static.instanceProvider.get(this.baseId);
    };

    protected get metadata(): Q {
        return this.getMetadata();
    };

    protected set metadata(metadata: Q) {
        this.updateMetadata(metadata);
    };

    private _metadata: Q;

    getMetadata(): Q {
        const baseInstance = this.getBaseInstance();
        const baseMetadata = baseInstance ? baseInstance.getMetadata() : {};
        return Object.assign({}, baseMetadata, this.static.Declaration, this._metadata) as Q;
    };

    updateMetadata(metadata: Q) {
        this._metadata = metadata;
        this.emit('metadata-update', metadata);
    };

    onMetaUpdate(cb: Function) {
        this.subscribe('metadata-update', cb);
    };

    onDelete(cb: Function) {
        this.subscribe('delete', cb);
    };

    onError(err: Error): void {
        console.warn(`An error occured at model ${this.static.modelName} id: ${this.id}`);
        console.log(err);
    };

    destroy() {
        this.destructor();
    };
}


enum AccessGroupTypes {
    all,
    owner,
    group,
}

enum AccessModes {
    create,
    read,
    update,
    delete,
    CR,
    CRU,
    CRUD,
    RU,
    RUD,
}

interface AccessDescriptor {
    groupType: AccessGroupTypes;
    mode: AccessModes;
};

interface BasicMetaData {
    name: string;
    title?: string;
    visible?: boolean;
    editable?: boolean;
}

declare interface FieldComponent {
    (props: {
        data: any;
        metadata: BasicMetaData;
        onChange(newData: any): void;
        error: string | null | void;
        [key: string] : any;
    }): any;
}

interface FieldMetadata extends BasicMetaData {
    system?: boolean;
    unique?: boolean;
    required?: boolean;
    access?: AccessDescriptor[] | number[];
    component?: FieldComponent;
}

class GenericFieldType<D> extends BasicMetaType<FieldMetadata> {

    static modelName = 'GenericFieldType';
    static Declaration: Partial<FieldMetadata> = {
        access: [{
            groupType: AccessGroupTypes.all,
            mode: AccessModes.CRUD
        }],
        visible: true,
    } as FieldMetadata;

    validator(data: D): boolean {
        return true;
    };

    component: FieldComponent = (props) => {
        return props.data ? props.data : {};
    };

    getComponent() {
        return (props: { data: D; [key: string] : any}) =>  {
            const component = this.metadata.component || this.component;
            return component({...props, metadata: this.metadata });
        }
    };

    constructor(arg: ReflexBasicAbstractArgument<FieldMetadata>) {
        super(arg);
    }
};

class StringFieldType extends GenericFieldType<string>  {

}

class DateFieldType extends GenericFieldType<Date>  {

}


interface SelectionDeclaration {
    path: string;
    modelName: string;
    fieldMetaType: string;
}

interface SelectionMetaData extends BasicMetaData  {
    fields: Array<SelectionDeclaration | Selection>;
    dataLayer: any;
    dataLayerName?: string;
    dataIds: string[];
}

interface ModelMetaData extends BasicMetaData  {
    storePath: string;
    idSupported: boolean;
}

declare interface DataProvider {
    name: string;
    subscribe(cb: Function);
}


class ReflexModel extends BasicMetaType<ModelMetaData> {

    dataProvider: DataProvider;

    static connect(mapProps, mapDispatch) {
        return (selection: Selection) => {};
    }

    dataChangeHandler(data) {

    }

    getModelByName(modelName: string) {

    }

    constructor(arg) {
        super(arg);

        this.dataProvider.subscribe(this.dataChangeHandler);
    }
};


class Selection extends BasicMetaType<SelectionMetaData> {

    static modelName = 'Selection';

    isValid: boolean;

    connect() {

    }

    render(component: FieldComponent) {

    }


    constructor(arg: ReflexBasicAbstractArgument<SelectionMetaData>) {
        super(arg);
        this.onMetaUpdate(this.connect);
    }
}