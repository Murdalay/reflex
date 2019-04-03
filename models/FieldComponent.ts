import { BasicMetaData } from './BasicMetadata';

export interface FieldComponent {
    (props: {
        data: any;
        metadata: BasicMetaData;
        onChange(newData: any): void;
        error: string | null | void;
        [key: string] : any;
    }): any;
}