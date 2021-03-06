// tslint:disable no-duplicate-imports
declare module "graphql-sequelize" {

    import {
        GraphQLFieldResolver,
        GraphQLFieldConfigArgumentMap,
        GraphQLFieldConfigMap,
        GraphQLInputFieldConfigMap,
        GraphQLObjectType,
        GraphQLInputObjectType,
    } from "graphql";
    import { ConnectionConfig } from "graphql-relay";
    import { Sequelize, Model as SequelizeModel } from "sequelize";

    export interface Model extends SequelizeModel<any, any> {
        associations: {
            [associationKey: string]: Association;
        };
        excludeFields?: string[];
        onlyFields?: string[];
        primaryKeyAttribute: string;
        queries?(models: ModelsHashInterface, modelTypes: ModelTypes, resolver: any, queries: any): any;
        mutations?(models: ModelsHashInterface, modelTypes: ModelTypes, resolver: any, mutations: any): any;
    }

    export interface Association {
        associationType: string;
        target: {
            name: string;
        };
        foreignKey: string;
        as: string;
        through: {
            model: Model;
        };
        accessors: {
            count: any;
        };
    }

    export interface ModelsHashInterface {
        [name: string]: Model;
    }

    export interface ModelTypes {
        [tableName: string]: GraphQLObjectType | SequelizeConnection;
    }

    export function defaultArgs(model: Model, isType: boolean): GraphQLFieldConfigArgumentMap;

    export function defaultListArgs(model: Model):
        GraphQLFieldConfigArgumentMap & { limit: any; order: any; where: any; };

    export interface AttributeFieldsOptions {
        // array of model attributes to ignore - default: []
        exclude?: string[];
        // only generate definitions for these model attributes - default: null
        only?: string[];
        // return an relay global id field - default: false
        globalId?: boolean;
        // rename fields - default: {}
        map?: AttributesMap | AttributesMapFn;
        // disable wrapping mandatory fields in `GraphQLNonNull` - default: false
        allowNull?: boolean;
        // convert model comment to GraphQL description - default: false
        commentToDescription?: boolean;
        // Cache enum types to prevent duplicate type name error - default: {}
        cache?: Cache;
    }

    export interface AttributesMap {
        [originalKey: string]: string;
    }
    export type AttributesMapFn = (originalKey: string) => string;

    export interface Cache {
        [modelName: string]: GraphQLObjectType | GraphQLInputObjectType;
    }

    export const typeMapper: any;
    export function attributeFields(model: Model, options?: AttributeFieldsOptions, isType?: boolean): AttributeFields;

    export type AttributeFields = GraphQLFieldConfigMap<any, any> | GraphQLInputFieldConfigMap;

    export function resolver(model: Model | Association, options?: {
        before?: Function;
        after?: Function;
        separate?: boolean;
        list?: boolean;
    }): GraphQLFieldResolver<any, any>;

    function sequelizeNodeInterface(sequelize: Sequelize): {
        nodeInterface: any;
        nodeField: any;
        nodeTypeMapper: any;
    };

    function sequelizeConnection(): any;

    export interface SequelizeConnection {
        connectionType: any;
        edgeType: any;
        nodeType: any;
        resolveEdge: any;
        connectionArgs: any;
        resolve: GraphQLFieldResolver<any, any>;
    }

    interface SequelizeConnectionOptions extends ConnectionConfig {
        name: string;
        nodeType: any;
        target: any;
        connectionFields: any;
        edgeFields: any;
    }

    interface Relay {
        sequelizeNodeInterface(sequelize: Sequelize): {
            nodeInterface: any;
            nodeField: any;
            nodeTypeMapper: any;
        };
        sequelizeConnection(options: SequelizeConnectionOptions): SequelizeConnection;
    }

    export const relay: Relay;

}

declare module "graphql-sequelize/lib/types/jsonType" {

}
