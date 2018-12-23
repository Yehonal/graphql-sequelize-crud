'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var Sequelize = require("sequelize");
var express = require("express");
var graphqlHTTP = require("express-graphql");
// tslint:disable-next-line:no-require-imports no-var-requires
var playground = require('graphql-playground/middleware').express;
var src_1 = require("../src");
var app = express();
var sequelize = new Sequelize('database', 'username', 'password', {
    // sqlite! now!
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
    }
}, {
    timestamps: true,
    classMethods: {
        queries: function (models, types) {
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
        },
        mutations: function (models, modelTypes) {
            return {
                createCustom: {
                    type: new graphql_1.GraphQLObjectType({
                        name: "Custom",
                        description: "Custom type for custom mutation",
                        fields: function () { return ({
                            customValueA: {
                                type: graphql_1.GraphQLString,
                            },
                            customValueB: {
                                type: graphql_1.GraphQLString,
                            },
                        }); }
                    }),
                    args: {
                        dataA: {
                            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
                        },
                        dataB: {
                            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
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
        }
    }
});
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
    var schema = src_1.getSchema(sequelize);
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true
    }));
    app.use('/playground', playground({ endpoint: '/graphql' }));
    var port = 3000;
    app.listen(port, function () {
        // tslint:disable-next-line:no-console
        console.log("Listening on port " + port);
    });
});
//# sourceMappingURL=index.js.map