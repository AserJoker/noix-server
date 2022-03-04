export type FIELD_TYPE =
  | "string"
  | "integer"
  | "float"
  | "boolean"
  | "text"
  | "url"
  | "enum"
  | "o2m"
  | "m2o"
  | "o2o"
  | "m2m";
export interface IOption {
  label: string;
  value: string;
}
export interface IBaseField {
  type: FIELD_TYPE;
  required?: boolean;
  name: string;
}
export interface ISimpleField extends IBaseField {
  type: "string" | "integer" | "float" | "boolean" | "text" | "url";
}
export interface IComplexField extends IBaseField {
  type: "o2m" | "m2o" | "o2o" | "m2m";
  refs: string[];
  rels: string[];
  refModel: string;
}

export interface IEnumField extends IBaseField {
  type: "enum";
  options: IOption[];
}

export type IField = ISimpleField | IEnumField | IComplexField;

export interface IModel {
  name: string;
  namespace: string;
  path: string;
  fields: Record<string, IField | FIELD_TYPE>;
  extends?: string;
  primary: string;
}
export interface IRecord {
  [key: string]: string | number | boolean | null | undefined;
}
export interface IMixedRecord {
  [key: string]:
    | IMixedRecord
    | IMixedRecord[]
    | string
    | number
    | boolean
    | null
    | undefined;
}

export type COLUMN_TYPE = "INTEGER" | "FLOAT" | "VARCHAR(256)" | "TEXT";
export interface IColumn {
  name: string;
  type: COLUMN_TYPE;
  unique?: boolean;
  notnull?: boolean;
}

export interface ITable {
  name: string;
  columns: IColumn[];
  data: IRecord[];
  primary: string;
}
export interface IDataAdapter {
  create: (model: IModel) => Promise<void>;
  query: (
    model: IModel,
    record: IRecord,
    offset?: number,
    size?: number
  ) => Promise<IRecord[]>;
  insert: (model: IModel, record: IRecord) => Promise<IRecord>;
  delete: (model: IModel, record: IRecord) => Promise<IRecord>;
  update: (model: IModel, record: IRecord) => Promise<IRecord>;
  createTask: () => Promise<number>;
  endTask: (task: number) => Promise<void>;
}
