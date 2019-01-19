'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _graphql = require('graphql');
var types_1 = require("./types");
var jsonType_1 = require("graphql-sequelize-teselagen/lib/types/jsonType");
var _jsonType2 = _interopRequireDefault(jsonType_1.default);
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var customTypeMapper;
/**
 * A function to set a custom mapping of types
 * @param {Function} mapFunc
 */
function mapType(mapFunc) {
    customTypeMapper = mapFunc;
}
exports.mapType = mapType;
/**
 * Checks the type of the sequelize data type and
 * returns the corresponding type in GraphQL
 * @param  {Object} sequelizeType
 * @param  {Object} sequelizeTypes
 * @return {Function} GraphQL type declaration
 */
function toGraphQL(sequelizeType, sequelizeTypes, isType) {
    // did the user supply a mapping function?
    // use their mapping, if it returns truthy
    // else use our defaults
    if (customTypeMapper) {
        var result = customTypeMapper(sequelizeType);
        if (result instanceof types_1.CustomGQLType) {
            result = isType ? result.graphType : result.graphInput;
        }
        if (result)
            return result;
    }
    var BOOLEAN = sequelizeTypes.BOOLEAN, ENUM = sequelizeTypes.ENUM, FLOAT = sequelizeTypes.FLOAT, CHAR = sequelizeTypes.CHAR, DECIMAL = sequelizeTypes.DECIMAL, DOUBLE = sequelizeTypes.DOUBLE, INTEGER = sequelizeTypes.INTEGER, BIGINT = sequelizeTypes.BIGINT, STRING = sequelizeTypes.STRING, TEXT = sequelizeTypes.TEXT, UUID = sequelizeTypes.UUID, DATE = sequelizeTypes.DATE, DATEONLY = sequelizeTypes.DATEONLY, TIME = sequelizeTypes.TIME, ARRAY = sequelizeTypes.ARRAY, VIRTUAL = sequelizeTypes.VIRTUAL, JSON = sequelizeTypes.JSON;
    // Regex for finding special characters
    var specialChars = /[^a-z\d_]/i;
    if (sequelizeType instanceof BOOLEAN)
        return _graphql.GraphQLBoolean;
    if (sequelizeType instanceof FLOAT || sequelizeType instanceof DOUBLE)
        return _graphql.GraphQLFloat;
    if (sequelizeType instanceof INTEGER) {
        return _graphql.GraphQLInt;
    }
    if (sequelizeType instanceof CHAR || sequelizeType instanceof STRING || sequelizeType instanceof TEXT || sequelizeType instanceof UUID || sequelizeType instanceof DATE || sequelizeType instanceof DATEONLY || sequelizeType instanceof TIME || sequelizeType instanceof BIGINT || sequelizeType instanceof DECIMAL) {
        return _graphql.GraphQLString;
    }
    if (sequelizeType instanceof ARRAY) {
        var elementType = toGraphQL(sequelizeType.type, sequelizeTypes);
        return new _graphql.GraphQLList(elementType);
    }
    if (sequelizeType instanceof ENUM) {
        return new _graphql.GraphQLEnumType({
            name: 'tempEnumName',
            values: sequelizeType.values.reduce(function (obj, value) {
                var sanitizedValue = value;
                if (specialChars.test(value)) {
                    sanitizedValue = value.split(specialChars).reduce(function (reduced, val, idx) {
                        var newVal = val;
                        if (idx > 0) {
                            newVal = "" + val[0].toUpperCase() + val.slice(1);
                        }
                        return "" + reduced + newVal;
                    });
                }
                obj[sanitizedValue] = {
                    value: value
                };
                return obj;
            }, {})
        });
    }
    if (sequelizeType instanceof VIRTUAL) {
        var returnType = sequelizeType.returnType ? toGraphQL(sequelizeType.returnType, sequelizeTypes) : _graphql.GraphQLString;
        return returnType;
    }
    if (sequelizeType instanceof JSON) {
        return _jsonType2.default;
    }
    throw new Error("Unable to convert " + (sequelizeType.key || sequelizeType.toSql()) + " to a GraphQL type");
}
exports.toGraphQL = toGraphQL;
//# sourceMappingURL=typeMapper.js.map