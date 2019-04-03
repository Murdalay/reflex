
export interface FieldDescriptor {
    name: string
    type: string;
    path: string;
    relatedModel?: string;
    modelRef?: string;
    groupFields?: FieldDescriptor[];
}