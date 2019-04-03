import ModelRef from './ModelRef';
import FieldGroup from './FieldGroup';
import { ReflexSchemaField } from './ReflexSchemaField';

export interface ReflexSchema {
    [key: string]: ReflexSchemaField
}