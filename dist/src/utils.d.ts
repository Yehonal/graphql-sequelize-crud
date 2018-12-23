import { GraphQLFieldConfigMap, GraphQLInputFieldConfigMap, GraphQLInputField, GraphQLType, GraphQLInputType, GraphQLFieldResolver } from 'graphql';
import { Model } from "./types";
export declare function mutationName(model: Model, type: string): string;
export declare function convertFieldsFromGlobalId(model: Model, data: {
    [key: string]: any;
}): void;
export declare function convertFieldsToGlobalId(model: Model, fields: GraphQLFieldConfigMap<any, any> | GraphQLInputFieldConfigMap): void;
export declare function connectionNameForAssociation(model: Model, associationName: string): string;
export declare function attributesForModel(model: Model): RawAttributes;
export interface RawAttributes {
    [key: string]: RawAttribute | undefined;
}
export interface RawAttribute {
    primaryKey: string;
    allowNull: boolean;
    references: {
        model: string;
    };
}
export declare function queryName(model: Model, type: string): string;
export declare function getTableName(model: Model): string;
export declare function globalIdInputField(modelName: string): GraphQLInputField;
export declare function createNonNullList<T extends GraphQLInputType | GraphQLType>(modelType: T): T;
export declare function createNonNullListResolver(resolver: GraphQLFieldResolver<any, any>): GraphQLFieldResolver<any, any>;
export declare function globalNullableIdInputField(modelName: string): GraphQLInputField;
