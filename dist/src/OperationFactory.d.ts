/// <reference path="../../src/@types/graphql-sequelize/index.d.ts" />
import { GraphQLObjectType, GraphQLFieldConfigMap, GraphQLFieldConfig } from 'graphql';
import { SequelizeConnection, Cache } from "graphql-sequelize-teselagen";
import { Model, ModelsHashInterface as Models, ModelTypes } from "./types";
export declare class OperationFactory {
    private models;
    private modelTypes;
    private associationsToModel;
    private associationsFromModel;
    private cache;
    constructor(config: OperationFactoryConfig);
    createRecord({mutations, model, modelType}: {
        mutations: Mutations;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
    findRecord({queries, model, modelType}: {
        queries: Queries;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
    findAll({queries, model, modelType}: {
        model: Model;
        modelType: GraphQLObjectType;
        queries: Queries;
    }): void;
    updateRecords({mutations, model, modelType}: {
        mutations: Mutations;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
    updateRecord({mutations, model, modelType}: {
        mutations: Mutations;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
    deleteRecords({mutations, model, modelType}: {
        mutations: Mutations;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
    deleteRecord({mutations, model, modelType}: {
        mutations: Mutations;
        model: Model;
        modelType: GraphQLObjectType;
    }): void;
}
export interface AssociationToModel {
    from: string;
    type: string;
    key: string;
    connection: SequelizeConnection;
    as: any;
}
export interface AssociationToModels {
    [tableName: string]: {
        [fieldName: string]: AssociationToModel;
    };
}
export interface AssociationFromModel {
    to: string;
    type: string;
    foreignKey: string;
    key: string;
    connection: SequelizeConnection;
    as: any;
}
export interface AssociationFromModels {
    [tableName: string]: {
        [fieldName: string]: AssociationFromModel;
    };
}
export interface Queries extends GraphQLFieldConfigMap<any, any> {
    [queryName: string]: GraphQLFieldConfig<any, any>;
}
export interface Mutations extends GraphQLFieldConfigMap<any, any> {
    [mutationName: string]: GraphQLFieldConfig<any, any>;
}
export interface OperationFactoryConfig {
    models: Models;
    modelTypes: ModelTypes;
    associationsToModel: AssociationToModels;
    associationsFromModel: AssociationFromModels;
    cache: Cache;
}
