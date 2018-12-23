"use strict";
// tslint:disable-next-line:no-reference
/// <reference path="./@types/graphql-sequelize/index.d.ts" />
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var _ = require("lodash");
var attributeFields_js_1 = require("./attributeFields.js");
var graphql_sequelize_teselagen_1 = require("graphql-sequelize-teselagen");
var sequelizeNodeInterface = graphql_sequelize_teselagen_1.relay.sequelizeNodeInterface, sequelizeConnection = graphql_sequelize_teselagen_1.relay.sequelizeConnection;
var OperationFactory_1 = require("./OperationFactory");
var utils_1 = require("./utils");
function getSchema(sequelize) {
    var _a = sequelizeNodeInterface(sequelize), nodeInterface = _a.nodeInterface, nodeField = _a.nodeField, nodeTypeMapper = _a.nodeTypeMapper;
    var models = sequelize.models;
    var queries = {};
    var mutations = {};
    var associationsToModel = {};
    var associationsFromModel = {};
    var cache = {};
    // Create types map
    var modelTypes = Object.keys(models).reduce(function (types, key) {
        var model = models[key];
        var modelType = new graphql_1.GraphQLObjectType({
            name: utils_1.getTableName(model),
            fields: function () {
                // Attribute fields
                var defaultFields = attributeFields_js_1.default(model, {
                    exclude: model.excludeFields ? model.excludeFields : [],
                    globalId: true,
                    commentToDescription: true,
                    cache: cache
                });
                // Lazily load fields
                return Object.keys(model.associations)
                    .reduce(function (fields, akey) {
                    var association = model.associations[akey];
                    var atype = association.associationType;
                    var target = association.target;
                    var targetType = modelTypes[target.name];
                    if (atype === "BelongsTo") {
                        fields[akey] = {
                            type: targetType,
                            resolve: graphql_sequelize_teselagen_1.resolver(association, {
                                separate: true
                            })
                        };
                    }
                    else {
                        var connectionName = utils_1.connectionNameForAssociation(model, akey);
                        var connection = modelTypes[connectionName];
                        fields[akey] = {
                            type: connection.connectionType,
                            args: connection.connectionArgs,
                            resolve: connection.resolve
                        };
                    }
                    return fields;
                }, defaultFields);
            },
            interfaces: [nodeInterface]
        });
        types[utils_1.getTableName(model)] = modelType;
        // === CRUD ====
        var operationFactory = new OperationFactory_1.OperationFactory({
            cache: cache,
            models: models,
            modelTypes: types,
            associationsFromModel: associationsFromModel,
            associationsToModel: associationsToModel,
        });
        // CREATE single
        operationFactory.createRecord({
            mutations: mutations,
            model: model,
            modelType: modelType,
        });
        // READ single
        operationFactory.findRecord({
            queries: queries,
            model: model,
            modelType: modelType,
        });
        // READ all
        operationFactory.findAll({
            queries: queries,
            model: model,
            modelType: modelType,
        });
        // UPDATE single
        operationFactory.updateRecord({
            mutations: mutations,
            model: model,
            modelType: modelType,
        });
        // UPDATE multiple
        operationFactory.updateRecords({
            mutations: mutations,
            model: model,
            modelType: modelType,
        });
        // DELETE single
        operationFactory.deleteRecord({
            mutations: mutations,
            model: model,
            modelType: modelType,
        });
        operationFactory.deleteRecords({
            mutations: mutations,
            model: model,
            modelType: modelType,
        });
        return types;
    }, {});
    // Create Connections
    _.each(models, function (model) {
        _.each(model.associations, function (association, akey) {
            var atype = association.associationType;
            var target = association.target;
            var foreignKey = association.foreignKey;
            var as = association.as;
            var targetType = modelTypes[target.name];
            var connectionName = utils_1.connectionNameForAssociation(model, akey);
            if (atype === "BelongsTo") {
                // BelongsTo
                _.set(associationsToModel, targetType.name + "." + akey, {
                    from: utils_1.getTableName(model),
                    type: atype,
                    key: akey,
                    foreignKey: foreignKey,
                    as: as
                });
                _.set(associationsFromModel, utils_1.getTableName(model) + "." + akey, {
                    to: targetType.name,
                    type: atype,
                    key: akey,
                    foreignKey: foreignKey,
                    as: as
                });
            }
            else {
                // HasMany
                var edgeFields = {};
                if (atype === "BelongsToMany") {
                    var aModel_1 = association.through.model;
                    // console.log('BelongsToMany model', aModel);
                    edgeFields = attributeFields_js_1.default(aModel_1, {
                        exclude: aModel_1.excludeFields ? aModel_1.excludeFields : [],
                        globalId: true,
                        commentToDescription: true,
                        cache: cache
                    });
                    // Pass Through model to resolve function
                    _.each(edgeFields, function (edgeField, field) {
                        var oldResolve = edgeField.resolve;
                        // console.log(field, edgeField, Object.keys(edgeField));
                        if (typeof oldResolve !== 'function') {
                            // console.log(oldResolve);
                            // tslint:disable-next-line:max-func-args
                            var resolve = function (source, args, context, info) {
                                var modelName = utils_1.getTableName(aModel_1);
                                var modelNode = source.node[modelName];
                                return modelNode[field];
                            };
                            edgeField.resolve = resolve.bind(edgeField);
                        }
                        else {
                            // tslint:disable-next-line:max-func-args
                            var resolve = function (source, args, context, info) {
                                var modelName = utils_1.getTableName(aModel_1);
                                var modelNode = source.node[modelName];
                                return oldResolve(modelNode, args, context, info);
                            };
                            edgeField.resolve = resolve.bind(edgeField);
                        }
                    });
                }
                var connection = sequelizeConnection({
                    name: connectionName,
                    nodeType: targetType,
                    target: association,
                    connectionFields: {
                        total: {
                            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
                            description: "Total count of " + targetType.name + " results associated with " + utils_1.getTableName(model) + ".",
                            resolve: function (_a) {
                                var source = _a.source;
                                var accessors = association.accessors;
                                return source[accessors.count]();
                            }
                        }
                    },
                    edgeFields: edgeFields
                });
                modelTypes[connectionName] = connection;
                _.set(associationsToModel, targetType.name + "." + utils_1.getTableName(model) + "_" + akey, {
                    from: utils_1.getTableName(model),
                    type: atype,
                    key: akey,
                    connection: connection,
                    as: as
                });
                _.set(associationsFromModel, utils_1.getTableName(model) + "." + targetType.name + "_" + akey, {
                    to: targetType.name,
                    type: atype,
                    key: akey,
                    connection: connection,
                    as: as
                });
            }
        });
    });
    // console.log("associationsToModel", associationsToModel);
    // console.log("associationsFromModel", associationsFromModel);
    // Custom Queries and Mutations
    _.each(Object.keys(models), function (key) {
        var model = models[key];
        // Custom Queries
        if (model.queries) {
            _.assign(queries, model.queries(models, modelTypes, graphql_sequelize_teselagen_1.resolver));
        }
        // Custom Mutations
        if (model.mutations) {
            _.assign(mutations, model.mutations(models, modelTypes, graphql_sequelize_teselagen_1.resolver));
        }
    });
    // Configure NodeTypeMapper
    nodeTypeMapper.mapTypes(__assign({}, modelTypes));
    var queryRoot = new graphql_1.GraphQLObjectType({
        name: "Root",
        description: "Root of the Schema",
        fields: function () { return (__assign({ root: {
                // Cite: https://github.com/facebook/relay/issues/112#issuecomment-170648934
                type: new graphql_1.GraphQLNonNull(queryRoot),
                description: "Self-Pointer from Root to Root",
                resolve: function () { return ({}); }
            } }, queries, { node: nodeField })); }
    });
    var mutationRoot = new graphql_1.GraphQLObjectType({
        name: "Mutations",
        fields: function () { return (__assign({}, mutations)); }
    });
    return new graphql_1.GraphQLSchema({
        query: queryRoot,
        mutation: mutationRoot
    });
}
exports.getSchema = getSchema;
//# sourceMappingURL=getSchema.js.map