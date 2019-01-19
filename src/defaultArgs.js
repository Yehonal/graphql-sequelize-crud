'use strict';

import * as _typeMapper from './typeMapper';


var typeMapper = _interopRequireWildcard(_typeMapper);

import _jsonType from 'graphql-sequelize-teselagen/lib/types/jsonType';

var _jsonType2 = _interopRequireDefault(_jsonType);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }
    newObj.default = obj;
    return newObj;
  }
}

export default function (Model, isType) {
  var result = {},
    key = Model.primaryKeyAttribute,
    attribute = Model.rawAttributes[key],
    type;

  if (key && attribute) {
    if (!attribute.graphType && !attribute.graphInput) {
      const type = typeMapper.toGraphQL(attribute.type, Model.sequelize.constructor, isType);

      result[key] = {
        type: type
      };
    } else {
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
};