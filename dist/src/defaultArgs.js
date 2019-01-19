'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var _typeMapper = require("./typeMapper");
var typeMapper = _interopRequireWildcard(_typeMapper);
var jsonType_1 = require("graphql-sequelize-teselagen/lib/types/jsonType");
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
    var result = {}, key = Model.primaryKeyAttribute, attribute = Model.rawAttributes[key], type;
    if (key && attribute) {
        if (!attribute.graphType && !attribute.graphInput) {
            var type_1 = typeMapper.toGraphQL(attribute.type, Model.sequelize.constructor, isType);
            result[key] = {
                type: type_1
            };
        }
        else {
            result[key] = {
                type: isType ? attribute.graphType : attribute.graphInput
            };
        }
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