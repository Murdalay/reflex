
export enum AccessGroupTypes {
    all,
    owner,
    group,
}

export enum AccessModes {
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

export interface AccessDescriptor {
    groupType: AccessGroupTypes;
    mode: AccessModes;
};