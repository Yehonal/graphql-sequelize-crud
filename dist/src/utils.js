"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var camelcase = require("camelcase");
var pluralize = require("pluralize");
var graphql_1 = require("graphql");
var graphql_relay_1 = require("graphql-relay");
// tslint:disable-next-line:no-reserved-keywords
function mutationName(model, type) {
    switch (type) {
        case 'create': {
            return camelcase(type + "_" + getTableName(model));
        }
        case 'update': {
            return camelcase(type + "_" + pluralize.plural(getTableName(model)));
        }
        case 'updateOne': {
            return camelcase("update_" + getTableName(model));
        }
        case 'delete': {
            return camelcase(type + "_" + pluralize.plural(getTableName(model)));
        }
        case 'deleteOne': {
            return camelcase("delete_" + getTableName(model));
        }
        default: {
            console.warn('Unknown mutation type: ', type);
            return camelcase(type + "_" + getTableName(model));
        }
    }
}
exports.mutationName = mutationName;
function convertFieldsFromGlobalId(model, data) {
    // Fix Relay Global ID
    var rawAttributes = attributesForModel(model);
    _.each(Object.keys(data), function (key) {
        if (key === "clientMutationId") {
            return;
        }
        // Check if reference attribute
        var attr = rawAttributes[key];
        if (!attr) {
            return;
        }
        if (attr.references || attr.primaryKey) {
            var id = graphql_relay_1.fromGlobalId(data[key]).id;
            if (id !== "") {
                // Check if id is numeric.
                if (!_.isNaN(_.toNumber(id))) {
                    data[key] = parseInt(id);
                }
                else {
                    data[key] = id;
                }
            }
        }
    });
}
exports.convertFieldsFromGlobalId = convertFieldsFromGlobalId;
function convertFieldsToGlobalId(model, fields) {
    // Fix Relay Global ID
    var rawAttributes = attributesForModel(model);
    _.each(Object.keys(rawAttributes), function (key) {
        if (key === "clientMutationId") {
            return;
        }
        // Check if reference attribute
        var attr = rawAttributes[key];
        if (!attr) {
            return;
        }
        if (attr.references) {
            // console.log(`Replacing ${getTableName(Model)}'s field ${k} with globalIdField.`);
            var modelName = attr.references.model;
            fields[key] = attr.allowNull ? globalNullableIdInputField(modelName) : globalIdInputField(modelName);
        }
        else if (attr.primaryKey) {
            // Make primaryKey optional (allowNull=True)
            fields[key] = globalNullableIdInputField(getTableName(model));
        }
    });
}
exports.convertFieldsToGlobalId = convertFieldsToGlobalId;
function connectionNameForAssociation(model, associationName) {
    return camelcase(getTableName(model) + "_" + associationName);
}
exports.connectionNameForAssociation = connectionNameForAssociation;
function attributesForModel(model) {
    return model.rawAttributes;
}
exports.attributesForModel = attributesForModel;
// tslint:disable-next-line:no-reserved-keywords
function queryName(model, type) {
    switch (type) {
        case 'findAll': {
            return camelcase(pluralize.plural(getTableName(model)));
        }
        case 'findById': {
            return camelcase(getTableName(model));
        }
        default: {
            console.warn('Unknown query type: ', type);
            return camelcase(type + "_" + getTableName(model));
        }
    }
}
exports.queryName = queryName;
function getTableName(model) {
    return model.name;
}
exports.getTableName = getTableName;
function globalIdInputField(modelName) {
    return {
        name: 'id',
        description: "The ID for " + modelName,
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
    };
}
exports.globalIdInputField = globalIdInputField;
function createNonNullList(modelType) {
    return new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(modelType)));
}
exports.createNonNullList = createNonNullList;
function createNonNullListResolver(resolver) {
    // tslint:disable-next-line:max-func-args
    return function (source, args, context, info) {
        return Promise.resolve(resolver(source, args, context, info))
            .then(function (results) {
            if (results === null || results === undefined) {
                return [];
            }
            else if (Array.isArray(results)) {
                return results;
            }
            return [results];
        });
    };
}
exports.createNonNullListResolver = createNonNullListResolver;
function globalNullableIdInputField(modelName) {
    return {
        name: 'id',
        description: "The ID for " + modelName,
        type: graphql_1.GraphQLID
    };
}
exports.globalNullableIdInputField = globalNullableIdInputField;
//# sourceMappingURL=utils.js.map