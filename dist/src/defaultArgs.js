'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var _typeMapper = require("./typeMapper");
var typeMapper = _interopRequireWildcard(_typeMapper);
var jsonType_1 = require("graphql-sequelize/lib/types/jsonType");
var _jsonType2 = _interopRequireDefault(jsonType_1.default);
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key))
                    newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
function default_1(Model, isType) {
    var result = {}, keys = Model.primaryKeyAttributes, type;
    if (keys) {
        keys.forEach(function (key) {
            var attribute = Model.rawAttributes[key];
            if (attribute) {
                if (attribute.graphType) {
                    type = attribute.graphType instanceof CustomGQLType ? attribute.graphType.getType(isType) : attribute.graphType;
                }
                else {
                    type = typeMapper.toGraphQL(attribute.type, Model.sequelize.constructor, isType);
                }
                result[key] = {
                    type: type
                };
            }
        });
    }
    // add where
    result.where = {
        type: _jsonType2.default,
        description: 'A JSON object conforming the the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/'
    };
    return result;
}
exports.default = default_1;
;
//# sourceMappingURL=defaultArgs.js.map