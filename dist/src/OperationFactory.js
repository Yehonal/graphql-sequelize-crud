"use strict";
// tslint:disable-next-line:no-reference
/// <reference path="./@types/graphql-sequelize/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var _ = require("lodash");
var camelcase = require("camelcase");
var graphql_relay_1 = require("graphql-relay");
var graphql_sequelize_teselagen_1 = require("graphql-sequelize-teselagen");
var attributeFields_js_1 = require("./attributeFields.js");
var utils_1 = require("./utils");
var OperationFactory = /** @class */ (function () {
    function OperationFactory(config) {
        this.models = config.models;
        this.modelTypes = config.modelTypes;
        this.associationsToModel = config.associationsToModel;
        this.associationsFromModel = config.associationsFromModel;
        this.cache = config.cache;
    }
    OperationFactory.prototype.createRecord = function (_a) {
        var mutations = _a.mutations, model = _a.model, modelType = _a.modelType;
        var _b = this, models = _b.models, modelTypes = _b.modelTypes, associationsToModel = _b.associationsToModel, associationsFromModel = _b.associationsFromModel, cache = _b.cache;
        var createMutationName = utils_1.mutationName(model, 'create');
        mutations[createMutationName] = graphql_relay_1.mutationWithClientMutationId({
            name: createMutationName,
            description: "Create " + utils_1.getTableName(model) + " record.",
            inputFields: function () {
                var exclude = model.excludeFields ? model.excludeFields : [];
                var fields = attributeFields_js_1.default(model, {
                    exclude: exclude,
                    commentToDescription: true,
                    cache: cache
                });
                utils_1.convertFieldsToGlobalId(model, fields);
                // FIXME: Handle timestamps
                // console.log('_timestampAttributes', Model._timestampAttributes);
                delete fields.createdAt;
                delete fields.updatedAt;
                return fields;
            },
            outputFields: function () {
                var output = {};
                // New Record
                output[camelcase("new_" + utils_1.getTableName(model))] = {
                    type: modelType,
                    description: "The new " + utils_1.getTableName(model) + ", if successfully created.",
                    // tslint:disable-next-line:max-func-args
                    resolve: function (args, arg2, context, info) {
                        return graphql_sequelize_teselagen_1.resolver(model, {})({}, (_a = {},
                            _a[model.primaryKeyAttribute] = args[model.primaryKeyAttribute],
                            _a), context, info);
                        var _a;
                    }
                };
                // New Edges
                _.each(associationsToModel[utils_1.getTableName(model)], function (association) {
                    var from = association.from, atype = association.type, field = association.key;
                    // console.log("Edge To", getTableName(Model), "From", from, field, atype);
                    if (atype !== "BelongsTo") {
                        // HasMany Association
                        var connection_1 = associationsFromModel[from][utils_1.getTableName(model) + "_" + field].connection;
                        var fromType = modelTypes[from];
                        // let nodeType = conn.nodeType;
                        // let association = Model.associations[field];
                        // let targetType = association
                        // console.log("Connection", getTableName(Model), field, nodeType, conn, association);
                        output[camelcase("new_" + fromType.name + "_" + field + "_Edge")] = {
                            type: connection_1.edgeType,
                            resolve: function (payload) { return connection_1.resolveEdge(payload); }
                        };
                    }
                });
                _.each(associationsFromModel[utils_1.getTableName(model)], function (association) {
                    var to = association.to, atype = association.type, foreignKey = association.foreignKey, field = association.key;
                    // console.log("Edge From", getTableName(Model), "To", to, field, as, atype, foreignKey);
                    if (atype === "BelongsTo") {
                        // BelongsTo association
                        var toType_1 = modelTypes[to];
                        output[field] = {
                            type: toType_1,
                            // tslint:disable-next-line:max-func-args
                            resolve: function (args, arg2, context, info) {
                                // console.log('Models', Models, Models[toType.name]);
                                return graphql_sequelize_teselagen_1.resolver(models[toType_1.name], {})({}, { id: args[foreignKey] }, context, info);
                            }
                        };
                    }
                });
                // console.log(`${getTableName(Model)} mutation output`, output);
                return output;
            },
            mutateAndGetPayload: function (data) {
                utils_1.convertFieldsFromGlobalId(model, data);
                return model.create(data);
            }
        });
    };
    OperationFactory.prototype.findRecord = function (_a) {
        var queries = _a.queries, model = _a.model, modelType = _a.modelType;
        var findByIdQueryName = utils_1.queryName(model, 'findById');
        var queryArgs = graphql_sequelize_teselagen_1.defaultArgs(model);
        utils_1.convertFieldsToGlobalId(model, queryArgs);
        var baseResolve = graphql_sequelize_teselagen_1.resolver(model, {});
        // tslint:disable-next-line:max-func-args
        var resolve = function (source, args, context, info) {
            utils_1.convertFieldsFromGlobalId(model, args);
            if (args.where) {
                utils_1.convertFieldsFromGlobalId(model, args.where);
            }
            return baseResolve(source, args, context, info);
        };
        queries[findByIdQueryName] = {
            type: modelType,
            args: queryArgs,
            resolve: resolve
        };
    };
    OperationFactory.prototype.findAll = function (_a) {
        var queries = _a.queries, model = _a.model, modelType = _a.modelType;
        var findAllQueryName = utils_1.queryName(model, 'findAll');
        var queryArgs = graphql_sequelize_teselagen_1.defaultListArgs(model);
        var baseResolve = utils_1.createNonNullListResolver(graphql_sequelize_teselagen_1.resolver(model, { list: true }));
        // tslint:disable-next-line:max-func-args
        var resolve = function (source, args, context, info) {
            if (args.where) {
                utils_1.convertFieldsFromGlobalId(model, args.where);
            }
            if (args.include) {
                utils_1.convertFieldsFromGlobalId(model, args.include);
            }
            return baseResolve(source, args, context, info);
        };
        queries[findAllQueryName] = {
            type: utils_1.createNonNullList(modelType),
            args: queryArgs,
            resolve: resolve,
        };
    };
    OperationFactory.prototype.updateRecords = function (_a) {
        var mutations = _a.mutations, model = _a.model, modelType = _a.modelType;
        var _b = this, models = _b.models, modelTypes = _b.modelTypes, associationsToModel = _b.associationsToModel, associationsFromModel = _b.associationsFromModel, cache = _b.cache;
        var updateMutationName = utils_1.mutationName(model, 'update');
        mutations[updateMutationName] = graphql_relay_1.mutationWithClientMutationId({
            name: updateMutationName,
            description: "Update multiple " + utils_1.getTableName(model) + " records.",
            inputFields: function () {
                var fields = attributeFields_js_1.default(model, {
                    exclude: model.excludeFields ? model.excludeFields : [],
                    commentToDescription: true,
                    cache: cache
                });
                utils_1.convertFieldsToGlobalId(model, fields);
                var updateModelTypeName = "Update" + utils_1.getTableName(model) + "ValuesInput";
                var updateModelValuesType = (cache[updateModelTypeName]
                    || new graphql_1.GraphQLInputObjectType({
                        name: updateModelTypeName,
                        description: "Values to update",
                        fields: fields
                    }));
                cache[updateModelTypeName] = updateModelValuesType;
                var updateModelWhereType = new graphql_1.GraphQLInputObjectType({
                    name: "Update" + utils_1.getTableName(model) + "WhereInput",
                    description: "Options to describe the scope of the search.",
                    fields: fields
                });
                return {
                    values: {
                        type: updateModelValuesType
                    },
                    where: {
                        type: updateModelWhereType,
                    }
                };
            },
            outputFields: function () {
                var output = {};
                // New Record
                output[camelcase("new_" + utils_1.getTableName(model))] = {
                    type: modelType,
                    description: "The new " + utils_1.getTableName(model) + ", if successfully created.",
                    // tslint:disable-next-line max-func-args
                    resolve: function (args, arg2, context, info) {
                        return graphql_sequelize_teselagen_1.resolver(model, {})({}, (_a = {},
                            _a[model.primaryKeyAttribute] = args[model.primaryKeyAttribute],
                            _a), context, info);
                        var _a;
                    }
                };
                // New Edges
                _.each(associationsToModel[utils_1.getTableName(model)], function (association) {
                    var from = association.from, atype = association.type, field = association.key;
                    // console.log("Edge To", getTableName(Model), "From", from, field, atype);
                    if (atype !== "BelongsTo") {
                        // HasMany Association
                        var connection_2 = associationsFromModel[from][utils_1.getTableName(model) + "_" + field].connection;
                        var fromType = modelTypes[from];
                        // console.log("Connection", getTableName(Model), field, nodeType, conn, association);
                        output[camelcase("new_" + fromType.name + "_" + field + "_Edge")] = {
                            type: connection_2.edgeType,
                            resolve: function (payload) { return connection_2.resolveEdge(payload); }
                        };
                    }
                });
                _.each(associationsFromModel[utils_1.getTableName(model)], function (association) {
                    var to = association.to, atype = association.type, foreignKey = association.foreignKey, field = association.key;
                    // console.log("Edge From", getTableName(Model), "To", to, field, as, atype, foreignKey);
                    if (atype === "BelongsTo") {
                        // BelongsTo association
                        var toType_2 = modelTypes[to];
                        output[field] = {
                            type: toType_2,
                            // tslint:disable-next-line max-func-args
                            resolve: function (args, arg2, context, info) {
                                // console.log('Models', models, models[toType.name]);
                                return graphql_sequelize_teselagen_1.resolver(models[toType_2.name], {})({}, { id: args[foreignKey] }, context, info);
                            }
                        };
                    }
                });
                // console.log(`${getTableName(Model)} mutation output`, output);
                var updateModelOutputTypeName = "Update" + utils_1.getTableName(model) + "Output";
                var outputType = (cache[updateModelOutputTypeName]
                    || new graphql_1.GraphQLObjectType({
                        name: updateModelOutputTypeName,
                        fields: output
                    }));
                cache[updateModelOutputTypeName] = outputType;
                return {
                    nodes: {
                        type: utils_1.createNonNullList(outputType),
                        // tslint:disable-next-line max-func-args
                        resolve: utils_1.createNonNullListResolver(function (source, args, context, info) {
                            // console.log('update', source, args);
                            return model.findAll({
                                where: source.where
                            });
                        })
                    },
                    affectedCount: {
                        type: graphql_1.GraphQLInt
                    }
                };
            },
            mutateAndGetPayload: function (data) {
                // console.log('mutate', data);
                var values = data.values, where = data.where;
                utils_1.convertFieldsFromGlobalId(model, values);
                utils_1.convertFieldsFromGlobalId(model, where);
                return model.update(values, {
                    where: where
                })
                    .then(function (result) {
                    return {
                        where: where,
                        affectedCount: result[0]
                    };
                });
            }
        });
    };
    OperationFactory.prototype.updateRecord = function (_a) {
        var mutations = _a.mutations, model = _a.model, modelType = _a.modelType;
        var _b = this, models = _b.models, modelTypes = _b.modelTypes, associationsToModel = _b.associationsToModel, associationsFromModel = _b.associationsFromModel, cache = _b.cache;
        var updateMutationName = utils_1.mutationName(model, 'updateOne');
        mutations[updateMutationName] = graphql_relay_1.mutationWithClientMutationId({
            name: updateMutationName,
            description: "Update a single " + utils_1.getTableName(model) + " record.",
            inputFields: function () {
                var fields = attributeFields_js_1.default(model, {
                    exclude: model.excludeFields ? model.excludeFields : [],
                    commentToDescription: true,
                    cache: cache
                });
                utils_1.convertFieldsToGlobalId(model, fields);
                var updateModelInputTypeName = "Update" + utils_1.getTableName(model) + "ValuesInput";
                var updateModelValuesType = cache[updateModelInputTypeName] || new graphql_1.GraphQLInputObjectType({
                    name: updateModelInputTypeName,
                    description: "Values to update",
                    fields: fields
                });
                cache[updateModelInputTypeName] = updateModelValuesType;
                return _a = {},
                    _a[model.primaryKeyAttribute] = utils_1.globalIdInputField(utils_1.getTableName(model)),
                    _a.values = {
                        type: updateModelValuesType
                    },
                    _a;
                var _a;
            },
            outputFields: function () {
                var output = {};
                // New Record
                output[camelcase("new_" + utils_1.getTableName(model))] = {
                    type: modelType,
                    description: "The new " + utils_1.getTableName(model) + ", if successfully created.",
                    // tslint:disable-next-line max-func-args
                    resolve: function (args, arg2, context, info) {
                        return graphql_sequelize_teselagen_1.resolver(model, {})({}, (_a = {},
                            _a[model.primaryKeyAttribute] = args[model.primaryKeyAttribute],
                            _a), context, info);
                        var _a;
                    }
                };
                // New Edges
                _.each(associationsToModel[utils_1.getTableName(model)], function (association) {
                    var from = association.from, atype = association.type, field = association.key;
                    // console.log("Edge To", getTableName(Model), "From", from, field, atype);
                    if (atype !== "BelongsTo") {
                        // HasMany Association
                        var connection_3 = associationsFromModel[from][utils_1.getTableName(model) + "_" + field].connection;
                        var fromType = modelTypes[from];
                        // console.log("Connection", getTableName(Model), field, nodeType, conn, association);
                        output[camelcase("new_" + fromType.name + "_" + field + "_Edge")] = {
                            type: connection_3.edgeType,
                            resolve: function (payload) { return connection_3.resolveEdge(payload); }
                        };
                    }
                });
                _.each(associationsFromModel[utils_1.getTableName(model)], function (association) {
                    var to = association.to, atype = association.type, foreignKey = association.foreignKey, field = association.key;
                    // console.log("Edge From", getTableName(Model), "To", to, field, as, atype, foreignKey);
                    if (atype === "BelongsTo") {
                        // BelongsTo association
                        var toType_3 = modelTypes[to];
                        output[field] = {
                            type: toType_3,
                            // tslint:disable-next-line:max-func-args
                            resolve: function (args, arg2, context, info) {
                                // console.log('Models', Models, Models[toType.name]);
                                return graphql_sequelize_teselagen_1.resolver(models[toType_3.name], {})({}, { id: args[foreignKey] }, context, info);
                            }
                        };
                    }
                });
                // console.log(`${getTableName(Model)} mutation output`, output);
                var updateModelOutputTypeName = "Update" + utils_1.getTableName(model) + "Output";
                var outputType = cache[updateModelOutputTypeName] || new graphql_1.GraphQLObjectType({
                    name: updateModelOutputTypeName,
                    fields: output
                });
                cache[updateModelOutputTypeName] = outputType;
                return output;
            },
            mutateAndGetPayload: function (data) {
                // console.log('mutate', data);
                var values = data.values;
                var where = (_a = {},
                    _a[model.primaryKeyAttribute] = data[model.primaryKeyAttribute],
                    _a);
                utils_1.convertFieldsFromGlobalId(model, values);
                utils_1.convertFieldsFromGlobalId(model, where);
                return model.update(values, {
                    where: where
                })
                    .then(function (result) {
                    return where;
                });
                var _a;
            }
        });
    };
    OperationFactory.prototype.deleteRecords = function (_a) {
        var mutations = _a.mutations, model = _a.model, modelType = _a.modelType;
        var cache = this.cache;
        var deleteMutationName = utils_1.mutationName(model, 'delete');
        mutations[deleteMutationName] = graphql_relay_1.mutationWithClientMutationId({
            name: deleteMutationName,
            description: "Delete " + utils_1.getTableName(model) + " records.",
            inputFields: function () {
                var fields = attributeFields_js_1.default(model, {
                    exclude: model.excludeFields ? model.excludeFields : [],
                    commentToDescription: true,
                    cache: cache
                });
                utils_1.convertFieldsToGlobalId(model, fields);
                var deleteModelWhereType = new graphql_1.GraphQLInputObjectType({
                    name: "Delete" + utils_1.getTableName(model) + "WhereInput",
                    description: "Options to describe the scope of the search.",
                    fields: fields
                });
                return {
                    where: {
                        type: deleteModelWhereType,
                    }
                };
            },
            outputFields: function () {
                return {
                    affectedCount: {
                        type: graphql_1.GraphQLInt
                    }
                };
            },
            mutateAndGetPayload: function (data) {
                var where = data.where;
                utils_1.convertFieldsFromGlobalId(model, where);
                return model.destroy({
                    where: where
                })
                    .then(function (affectedCount) {
                    return {
                        where: where,
                        affectedCount: affectedCount
                    };
                });
            }
        });
    };
    OperationFactory.prototype.deleteRecord = function (_a) {
        var mutations = _a.mutations, model = _a.model, modelType = _a.modelType;
        var deleteMutationName = utils_1.mutationName(model, 'deleteOne');
        mutations[deleteMutationName] = graphql_relay_1.mutationWithClientMutationId({
            name: deleteMutationName,
            description: "Delete single " + utils_1.getTableName(model) + " record.",
            inputFields: function () {
                return _a = {},
                    _a[model.primaryKeyAttribute] = utils_1.globalIdInputField(utils_1.getTableName(model)),
                    _a;
                var _a;
            },
            outputFields: function () {
                var idField = camelcase("deleted_" + utils_1.getTableName(model) + "_id");
                return _a = {},
                    _a[idField] = {
                        type: graphql_1.GraphQLID,
                        resolve: function (source) {
                            return source[model.primaryKeyAttribute];
                        }
                    },
                    _a;
                var _a;
            },
            mutateAndGetPayload: function (data) {
                var where = (_a = {},
                    _a[model.primaryKeyAttribute] = data[model.primaryKeyAttribute],
                    _a);
                utils_1.convertFieldsFromGlobalId(model, where);
                return model.destroy({
                    where: where
                })
                    .then(function (affectedCount) {
                    return data;
                });
                var _a;
            }
        });
    };
    return OperationFactory;
}());
exports.OperationFactory = OperationFactory;
//# sourceMappingURL=OperationFactory.js.map