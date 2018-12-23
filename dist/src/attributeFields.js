"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typeMapper = require("graphql-sequelize-teselagen/lib/typeMapper");
var graphql_1 = require("graphql");
var graphql_relay_1 = require("graphql-relay");
function default_1(Model, options) {
    if (options === void 0) { options = {}; }
    var cache = options.cache || {};
    var result = Object.keys(Model.rawAttributes).reduce(function (memo, key) {
        if (options.exclude) {
            if (typeof options.exclude === 'function' && options.exclude(key))
                return memo;
            if (Array.isArray(options.exclude) && ~options.exclude.indexOf(key))
                return memo;
        }
        if (options.only) {
            if (typeof options.only === 'function' && !options.only(key))
                return memo;
            if (Array.isArray(options.only) && !~options.only.indexOf(key))
                return memo;
        }
        var attribute = Model.rawAttributes[key], type = attribute.type;
        if (options.map) {
            if (typeof options.map === 'function') {
                key = options.map(key) || key;
            }
            else {
                key = options.map[key] || key;
            }
        }
        memo[key] = {
            type: typeMapper.toGraphQL(type, Model.sequelize.constructor)
        };
        if (memo[key].type instanceof graphql_1.GraphQLEnumType) {
            var typeName = "" + Model.name + key + "EnumType";
            /*
            Cache enum types to prevent duplicate type name error
            when calling attributeFields multiple times on the same model
            */
            if (cache[typeName]) {
                memo[key].type = cache[typeName];
            }
            else {
                memo[key].type.name = typeName;
                cache[typeName] = memo[key].type;
            }
        }
        if (!options.allowNull) {
            if ((!options.checkDefaults || typeof attribute.defaultValue == "undefined") && (attribute.allowNull === false || attribute.primaryKey === true)) {
                memo[key].type = new graphql_1.GraphQLNonNull(memo[key].type);
            }
        }
        /* should be handled by database instead
        if (attribute.defaultValue) {
            memo[key].defaultValue = attribute.defaultValue;
        }*/
        if (options.commentToDescription) {
            if (typeof attribute.comment === 'string') {
                memo[key].description = attribute.comment;
            }
        }
        return memo;
    }, {});
    if (options.globalId) {
        result.id = graphql_relay_1.globalIdField(Model.name, function (instance) { return instance[Model.primaryKeyAttribute]; });
    }
    return result;
}
exports.default = default_1;
;
//# sourceMappingURL=attributeFields.js.map