'use strict';
var _a = require('graphql'), GraphQLString = _a.GraphQLString, GraphQLNonNull = _a.GraphQLNonNull, GraphQLObjectType = _a.GraphQLObjectType;
var CustomGQLType = require("../src/types").CustomGQLType;
//import { ModelsHashInterface as Models } from "sequelize";
var Sequelize = require('sequelize');
var express = require('express');
var graphqlHTTP = require('express-graphql');
var express = require('graphql-playground/middleware').express;
var getSchema = require('../src').getSchema;
var app = express();
var sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
});
// tslint:disable-next-line:variable-name
var User = sequelize.define('User', {
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    avatar: {
        type: Sequelize.BLOB,
        // you can define a custom type for graph in sequelize model when a type is not recognized by graphql-sequelize-crud
        graphType: new CustomGQLType(GraphQLString, GraphQLObjectType)
    }
}, {
    timestamps: true,
});
User.excludeFields = ["password"];
// User.onlyFields = ["email"]; inclusive filter as an alternative to excludeFields
/**
 * @param {Models} models
 * @param {ModelTypes} types
 */
User.queries = function (models, types, resolver, queries) {
    return {
        viewer: {
            type: types.User,
            description: "Get a User by username",
            args: {},
            resolve: function (source, args, context) {
                return Promise.resolve(null);
            },
        },
    };
};
User.mutations = function (models, modelTypes, resolver, mutations) {
    return {
        createCustom: {
            type: new GraphQLObjectType({
                name: "Custom",
                description: "Custom type for custom mutation",
                fields: function () { return ({
                    customValueA: {
                        type: GraphQLString,
                    },
                    customValueB: {
                        type: GraphQLString,
                    },
                }); }
            }),
            args: {
                dataA: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                dataB: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: function (obj, _a) {
                var dataA = _a.dataA, dataB = _a.dataB;
                return Promise.resolve({
                    customValueA: dataA,
                    customValueB: dataB,
                });
            }
        }
    };
};
// tslint:disable-next-line:variable-name
var Todo = sequelize.define('Todo', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: true
    },
    text: {
        type: Sequelize.STRING,
        allowNull: false
    },
    completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
}, {
    timestamps: true
});
// tslint:disable-next-line:variable-name
var TodoAssignee = sequelize.define('TodoAssignee', {
    primary: {
        type: Sequelize.BOOLEAN
    }
}, {
    timestamps: true
});
User.hasMany(Todo, {
    as: 'todos',
    foreignKey: 'userId'
});
Todo.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId'
});
// belongsToMany
User.belongsToMany(Todo, {
    as: 'assignedTodos',
    through: TodoAssignee
});
Todo.belongsToMany(User, {
    as: 'assignees',
    through: TodoAssignee
});
sequelize.sync({
    force: true
})
    .then(function () {
    var schema = getSchema(sequelize);
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true
    }));
    app.use('/playground', playground({
        endpoint: '/graphql'
    }));
    var port = 3000;
    app.listen(port, function () {
        // tslint:disable-next-line:no-console
        console.log("Listening on port " + port);
    });
});
//# sourceMappingURL=index.js.map