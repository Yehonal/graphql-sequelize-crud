// tslint:disable-next-line:no-reference
/// <reference path="./@types/index.d.ts" />

export { Model, Association, ModelsHashInterface, ModelTypes } from "graphql-sequelize-teselagen";

class CustomGQLType {
    graphType: any
    graphInput: any

    constructor(type: any, input?: any) {
        this.graphType = type;
        this.graphInput = input ? input : type;
    }
}

export { CustomGQLType }