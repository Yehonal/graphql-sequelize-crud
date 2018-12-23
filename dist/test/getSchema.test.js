'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable no-multiline-string max-line-length insecure-random
var chai_1 = require("chai");
var graphql_1 = require("graphql");
var src_1 = require("../src");
var Sequelize = require("sequelize");
var debug = false;
describe('getSchema', function () {
    var rand;
    var sequelize;
    // tslint:disable-next-line:variable-name
    var User;
    // tslint:disable-next-line:variable-name
    var Todo;
    // tslint:disable-next-line:variable-name
    var TodoAssignee;
    before(function (cb) {
        sequelize = new Sequelize('database', 'username', 'password', {
            // sqlite! now!
            dialect: 'sqlite',
            // the storage engine for sqlite
            // - default ':memory:'
            // storage: 'path/to/database.sqlite'
            // disable logging; default: console.log
            logging: debug,
        });
        User = sequelize.define('User', {
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            excludedField: {
                type: Sequelize.STRING,
                allowNull: true
            }
        }, {
            timestamps: false,
            classMethods: {
                queries: function () {
                    return {};
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
        sequelize.models.User.excludeFields = ['excludedField'];
        Todo = sequelize.define('Todo', {
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
        User.hasMany(Todo, {
            as: 'todos',
            foreignKey: 'userId'
        });
        Todo.belongsTo(User, {
            as: 'user',
            foreignKey: 'userId'
        });
        TodoAssignee = sequelize.define('TodoAssignee', {
            primary: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            }
        }, {
            timestamps: true
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
        cb();
    });
    beforeEach(function (cb) {
        // tslint:disable-next-line:no-magic-numbers
        rand = parseInt("" + Math.random() * 1000000000);
        sequelize.sync({
            force: true
        })
            .then(function () {
            cb();
        });
    });
    afterEach(function (cb) {
        if (debug) {
            var models_1 = sequelize.models;
            Promise.all(Object.keys(models_1)
                .map(function (modelName) { return models_1[modelName].findAll(); }))
                .then(function (result) { return console.log(JSON.stringify(result, null, 2)); })
                .catch(function (error) { return console.error(error); })
                .then(cb);
        }
        else {
            cb();
        }
    });
    it('should return GraphQL Schema', function () {
        var schema = src_1.getSchema(sequelize);
        // console.log(Object.keys(schema));
        // console.log(Object.keys(schema._queryType._fields));
        // console.log(Object.keys(schema._mutationType._fields));
        chai_1.expect(schema).to.be.an.instanceof(graphql_1.GraphQLSchema);
        chai_1.expect(schema).to.be.an('object');
        chai_1.expect(schema._queryType).to.be.an('object');
        chai_1.expect(schema._queryType._fields).to.be.an('object');
        chai_1.expect(Object.keys(schema._queryType._fields)).to.deep.equal([
            'root',
            'user', 'users',
            'todo', 'todos',
            'todoAssignee', 'todoAssignees',
            'node'
        ]);
        chai_1.expect(schema._mutationType).to.be.an('object');
        chai_1.expect(schema._mutationType._fields).to.be.an('object');
        chai_1.expect(Object.keys(schema._mutationType._fields)).to.deep.equal([
            'createUser', 'updateUser', 'updateUsers', 'deleteUser', 'deleteUsers',
            'createTodo', 'updateTodo', 'updateTodos', 'deleteTodo', 'deleteTodos',
            'createTodoAssignee', 'updateTodoAssignee', 'updateTodoAssignees', 'deleteTodoAssignee', 'deleteTodoAssignees',
            'createCustom',
        ]);
    });
    it('should successfully query empty records', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var queryUser = "query {\n      todos {\n        id\n        text\n        completed\n        user {\n          id\n          email\n        }\n      }\n      todoAssignees {\n        id\n        primary\n        UserId\n        TodoId\n      }\n      users {\n        id\n        email\n        todos {\n          total\n          edges {\n            node {\n              id\n              text\n              completed\n            }\n          }\n        }\n        assignedTodos {\n          total\n          edges {\n            id\n            primary\n            node {\n              id\n              text\n              completed\n            }\n          }\n        }\n      }\n    }";
        graphql_1.graphql(schema, queryUser)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            cb();
        })
            .catch(function (error) {
            console.error(error);
            cb(error);
        });
    });
    it('should successfully create records', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createUserTest($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                clientMutationId: "test"
            }
        };
        var createTodoVariables = {
            input: {
                text: "Something",
                completed: false,
                userId: undefined,
                clientMutationId: "test"
            }
        };
        var createTodoAssigneeVariables1 = {
            input: {
                primary: true,
                UserId: undefined,
                TodoId: undefined,
                clientMutationId: "test"
            }
        };
        // let createTodoAssigneeVariables2 = {
        //   "input": {
        //     "primary": false,
        //     "UserId": userId,
        //     "TodoId": todoId,
        //     "clientMutationId": "yo"
        //   }
        // };
        var userId;
        var todoId;
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.errors).to.be.equal(undefined, "An error occurred: " + result.errors);
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser.id).to.be.an('string');
            chai_1.expect(result.data.createUser.newUser.email).to.be.equal(createUserVariables.input.email);
            chai_1.expect(result.data.createUser.newUser.password).to.be.equal(createUserVariables.input.password);
            userId = result.data.createUser.newUser.id;
            var createTodoMutation = "\n          mutation createTodoTest($input: createTodoInput!) {\n            createTodo(input: $input) {\n              newTodo {\n                id\n                text\n                completed\n                user {\n                  id\n                  email\n                }\n              }\n              user {\n                id\n                email\n              }\n            }\n          }\n        ";
            createTodoVariables.input.userId = userId;
            return graphql_1.graphql(schema, createTodoMutation, {}, {}, createTodoVariables);
        })
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.errors).to.be.equal(undefined, "An error occurred: " + result.errors);
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createTodo).to.be.an('object');
            chai_1.expect(result.data.createTodo.newTodo).to.be.an('object');
            chai_1.expect(result.data.createTodo.newTodo.id).to.be.an('string');
            chai_1.expect(result.data.createTodo.user).to.be.an('object');
            chai_1.expect(result.data.createTodo.user.id).to.be.an('string');
            chai_1.expect(result.data.createTodo.newTodo.text).to.be.equal(createTodoVariables.input.text);
            chai_1.expect(result.data.createTodo.newTodo.completed).to.be.equal(createTodoVariables.input.completed);
            todoId = result.data.createTodo.newTodo.id;
            var createTodoAssigneeMutation = "\n          mutation createTodoAssigneeTest($input: createTodoAssigneeInput!) {\n            createTodoAssignee(input: $input) {\n              newTodoAssignee {\n                id\n                primary\n              }\n            }\n          }\n        ";
            createTodoAssigneeVariables1.input.UserId = userId;
            createTodoAssigneeVariables1.input.TodoId = todoId;
            return graphql_1.graphql(schema, createTodoAssigneeMutation, {}, {}, createTodoAssigneeVariables1);
        })
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.errors).to.be.equal(undefined, "An error occurred: " + result.errors);
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createTodoAssignee).to.be.an('object');
            chai_1.expect(result.data.createTodoAssignee.newTodoAssignee).to.be.an('object');
            chai_1.expect(result.data.createTodoAssignee.newTodoAssignee.id).to.be.an('string');
            chai_1.expect(result.data.createTodoAssignee.newTodoAssignee.primary)
                .to.be.equal(createTodoAssigneeVariables1.input.primary);
            var queryUser = "query {\n          todos {\n            id\n            text\n            completed\n            user {\n              id\n              email\n            }\n          }\n          todoAssignees {\n            id\n            primary\n            UserId\n            TodoId\n          }\n          users {\n            id\n            email\n            todos {\n              total\n              edges {\n                node {\n                  id\n                  text\n                  completed\n                }\n              }\n            }\n            assignedTodos {\n              total\n              edges {\n                id\n                primary\n                node {\n                  id\n                  text\n                  completed\n                }\n              }\n            }\n          }\n        }";
            return graphql_1.graphql(schema, queryUser);
        })
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.todoAssignees).to.be.an('array');
            chai_1.expect(result.data.todoAssignees[0].id)
                .to.be.an('string')
                .equal('VG9kb0Fzc2lnbmVlOjE=');
            chai_1.expect(result.data.users).to.be.an('array');
            chai_1.expect(result.data.users[0].id)
                .to.be.an('string')
                .equal('VXNlcjox');
            chai_1.expect(result.data.users[0].todos).to.be.an('object');
            chai_1.expect(result.data.users[0].todos.edges).to.be.an('array');
            chai_1.expect(result.data.users[0].todos.edges[0]).to.be.an('object');
            chai_1.expect(result.data.users[0].todos.edges[0].node).to.be.an('object');
            chai_1.expect(result.data.todos[0].user).to.be.an('object');
            chai_1.expect(result.data.todos[0].user.id)
                .to.be.an('string')
                .equal(result.data.users[0].id);
            chai_1.expect(result.data.users[0].assignedTodos).to.be.an('object');
            chai_1.expect(result.data.users[0].assignedTodos.total).to.be.an('number');
            chai_1.expect(result.data.users[0].assignedTodos.edges).to.be.an('array');
            chai_1.expect(result.data.users[0].assignedTodos.edges[0]).to.be.an('object');
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].primary).to.be.an('boolean');
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].node).to.be.an('object');
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].primary).to.be.equal(true);
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].id)
                .to.be.an('string')
                .equal(result.data.todoAssignees[0].id);
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].node.id).to.be.an('string');
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].id)
                .to.be.an('string')
                .equal(result.data.todoAssignees[0].id);
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].node.id)
                .to.be.an('string')
                .equal(result.data.todos[0].id);
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].node.text)
                .to.be.an('string')
                .equal(createTodoVariables.input.text);
            chai_1.expect(result.data.users[0].assignedTodos.edges[0].node.completed)
                .to.be.an('boolean')
                .equal(createTodoVariables.input.completed);
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should successfully create and update single User record', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createUserTest($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                clientMutationId: "test"
            }
        };
        var updateUserMutation = "\n      mutation updateUserTest($input: updateUserInput!) {\n        updateUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var updateUserVariables = {
            input: {
                id: undefined,
                values: {
                    email: "testuser" + (rand + 1) + "@web.com",
                    password: "password" + (rand - 1),
                },
                clientMutationId: "test"
            }
        };
        var userId;
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser.id)
                .to.be.an('string')
                .equal('VXNlcjox');
            userId = result.data.createUser.newUser.id;
            updateUserVariables.input.id = userId;
            // console.log(updateUserVariables);
            return graphql_1.graphql(schema, updateUserMutation, {}, {}, updateUserVariables);
        })
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.updateUser).to.be.an('object');
            chai_1.expect(result.data.updateUser.newUser).to.be.an('object');
            chai_1.expect(result.data.updateUser.newUser.id)
                .to.be.an('string')
                .equal(updateUserVariables.input.id);
            chai_1.expect(result.data.updateUser.newUser.email).to.be.an('string');
            chai_1.expect(result.data.updateUser.newUser.password).to.be.an('string');
            chai_1.expect(result.data.updateUser.newUser.id)
                .to.be.an('string')
                .equal(updateUserVariables.input.id);
            chai_1.expect(result.data.updateUser.newUser.email)
                .to.be.an('string')
                .equal(updateUserVariables.input.values.email);
            chai_1.expect(result.data.updateUser.newUser.password)
                .to.be.an('string')
                .equal(updateUserVariables.input.values.password);
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should successfully create and update User records', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createUserTest($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                clientMutationId: "test"
            }
        };
        var updateUsersMutation = "\n      mutation updateUsersTest($input: updateUsersInput!) {\n        updateUsers(input: $input) {\n          affectedCount\n          nodes {\n            newUser {\n              id\n              email\n              password\n            }\n          }\n        }\n      }\n    ";
        var updateUsersVariables = {
            input: {
                values: {
                    email: "testuser" + (rand + 1) + "@web.com",
                    password: "password" + (rand + 1),
                },
                where: {},
                clientMutationId: "test"
            }
        };
        var userId;
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser.id)
                .to.be.an('string')
                .equal('VXNlcjox');
            userId = result.data.createUser.newUser.id;
            updateUsersVariables.input.where.id = userId;
            // console.log(updateUserVariables);
            return graphql_1.graphql(schema, updateUsersMutation, {}, {}, updateUsersVariables);
        })
            .then(function (result) {
            // console.log(result, JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.updateUsers).to.be.an('object');
            chai_1.expect(result.data.updateUsers.nodes).to.be.an('array');
            chai_1.expect(result.data.updateUsers.nodes.length).to.be.equal(1);
            chai_1.expect(result.data.updateUsers.affectedCount)
                .to.be.an('number')
                .equal(1);
            chai_1.expect(result.data.updateUsers.nodes[0]).to.be.an('object');
            chai_1.expect(result.data.updateUsers.nodes[0].newUser).to.be.an('object');
            chai_1.expect(result.data.updateUsers.nodes[0].newUser.id)
                .to.be.an('string')
                .equal(updateUsersVariables.input.where.id);
            chai_1.expect(result.data.updateUsers.nodes[0].newUser.email).to.be.an('string');
            chai_1.expect(result.data.updateUsers.nodes[0].newUser.password).to.be.an('string');
            chai_1.expect(result.data.updateUsers.nodes[0].newUser.email).to.be.equal(updateUsersVariables.input.values.email);
            chai_1.expect(result.data.updateUsers.nodes[0].newUser.password).to.be.equal(updateUsersVariables.input.values.password);
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should successfully create and delete User records', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createUserTest($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                clientMutationId: "test"
            }
        };
        var deleteUsersMutation = "\n      mutation deleteUsersTest($input: deleteUsersInput!) {\n        deleteUsers(input: $input) {\n          affectedCount\n        }\n      }\n    ";
        var deleteUsersVariables = {
            input: {
                where: {},
                clientMutationId: "test"
            }
        };
        var userId;
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser.id)
                .to.be.an('string')
                .equal('VXNlcjox');
            userId = result.data.createUser.newUser.id;
            deleteUsersVariables.input.where.id = userId;
            // console.log(updateUserVariables);
            return graphql_1.graphql(schema, deleteUsersMutation, {}, {}, deleteUsersVariables);
        })
            .then(function (result) {
            // console.log(result);
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.deleteUsers).to.be.an('object');
            // expect(result.data.deleteUsers.nodes).to.be.an('array');
            chai_1.expect(result.data.deleteUsers.affectedCount).to.be.equal(1);
            // expect(result.data.deleteUsers.nodes.length).to.be.equal(1);
            // expect(result.data.deleteUsers.nodes[0]).to.be.an('object');
            // expect(result.data.deleteUsers.nodes[0].newUser).to.be.an('object');
            // expect(result.data.deleteUsers.nodes[0].newUser.id).to.be.an('string');
            // expect(result.data.deleteUsers.nodes[0].newUser.email).to.be.an('string');
            // expect(result.data.deleteUsers.nodes[0].newUser.password).to.be.an('string');
            //
            // expect(result.data.deleteUsers.nodes[0].newUser.email).to.be.equal(updateUserVariables.input.values.email);
            // expect(result.data.deleteUsers.nodes[0].newUser.password).to.be.equal(updateUserVariables.input.values.password);
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should successfully create and delete single User record', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createUserTest($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                clientMutationId: "test"
            }
        };
        var deleteUserMutation = "\n      mutation deleteUserTest($input: deleteUserInput!) {\n        deleteUser(input: $input) {\n          deletedUserId\n        }\n      }\n    ";
        var deleteUserVariables = {
            input: {
                clientMutationId: "test",
                id: undefined
            }
        };
        var userId;
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser).to.be.an('object');
            chai_1.expect(result.data.createUser.newUser.id)
                .to.be.an('string')
                .equal('VXNlcjox');
            userId = result.data.createUser.newUser.id;
            deleteUserVariables.input.id = userId;
            // console.log(updateUserVariables);
            return graphql_1.graphql(schema, deleteUserMutation, {}, {}, deleteUserVariables);
        })
            .then(function (result) {
            // console.log(result);
            // console.log(JSON.stringify(result, undefined, 4));
            chai_1.expect(result).to.be.an('object');
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.deleteUser).to.be.an('object');
            // tslint:disable-next-line:id-length
            chai_1.expect(result.data.deleteUser.deletedUserId).to.be.a('string');
            chai_1.expect(result.data.deleteUser.deletedUserId).to.be.equal(deleteUserVariables.input.id);
            // expect(result.data.deleteUsers.nodes.length).to.be.equal(1);
            // expect(result.data.deleteUsers.nodes[0]).to.be.an('object');
            // expect(result.data.deleteUsers.nodes[0].newUser).to.be.an('object');
            // expect(result.data.deleteUsers.nodes[0].newUser.id).to.be.an('string');
            // expect(result.data.deleteUsers.nodes[0].newUser.email).to.be.an('string');
            // expect(result.data.deleteUsers.nodes[0].newUser.password).to.be.an('string');
            //
            // expect(result.data.deleteUsers.nodes[0].newUser.email).to.be.equal(updateUserVariables.input.values.email);
            // expect(result.data.deleteUsers.nodes[0].newUser.password).to.be.equal(updateUserVariables.input.values.password);
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should fail to create user with excluded field', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n          mutation createUserTest($input: createUserInput!) {\n            createUser(input: $input) {\n              newUser {\n                id\n                email\n                password\n              }\n            }\n          }\n        ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                excludedField: "excluded" + rand,
                clientMutationId: "test"
            }
        };
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            var _a = result.errors, errors = _a === void 0 ? [] : _a;
            chai_1.expect(errors).to.be.length(1);
            var error = errors[0];
            chai_1.expect(error).to.be.instanceOf(graphql_1.GraphQLError);
            chai_1.expect(error.message)
                .to.be.an('string')
                .to.contain('excludedField')
                .to.contain('Unknown field');
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should fail to create user with excluded field', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createUserMutation = "\n      mutation createCustom($input: createUserInput!) {\n        createUser(input: $input) {\n          newUser {\n            id\n            email\n            password\n          }\n        }\n      }\n    ";
        var createUserVariables = {
            input: {
                email: "testuser" + rand + "@web.com",
                password: "password" + rand,
                excludedField: "excluded" + rand,
                clientMutationId: "test"
            }
        };
        return graphql_1.graphql(schema, createUserMutation, {}, {}, createUserVariables)
            .then(function (result) {
            var _a = result.errors, errors = _a === void 0 ? [] : _a;
            chai_1.expect(errors).to.be.length(1);
            var error = errors[0];
            chai_1.expect(error).to.be.instanceOf(graphql_1.GraphQLError);
            chai_1.expect(error.message)
                .to.be.an('string')
                .to.contain('excludedField')
                .to.contain('Unknown field');
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
    it('should successfully create custom record with custom mutation', function (cb) {
        var schema = src_1.getSchema(sequelize);
        var createCustomMutation = "\n    mutation createCustomTest($dataA: String!, $dataB: String!) {\n      createCustom(dataA: $dataA, dataB: $dataB) {\n        customValueA\n        customValueB\n      }\n    }\n    ";
        var createCustomVariables = {
            dataA: "hello",
            dataB: "world"
        };
        return graphql_1.graphql(schema, createCustomMutation, {}, {}, createCustomVariables)
            .then(function (result) {
            chai_1.expect(result).to.be.an('object');
            var _a = result.errors, errors = _a === void 0 ? [] : _a;
            chai_1.expect(errors).to.be.length(0);
            chai_1.expect(result.data).to.be.an('object');
            if (!result.data) {
                throw new Error("No data");
            }
            chai_1.expect(result.data.createCustom).to.be.an('object');
            chai_1.expect(result.data.createCustom.customValueA)
                .to.be.an('string')
                .equal('hello');
            chai_1.expect(result.data.createCustom.customValueB)
                .to.be.an('string')
                .equal('world');
            cb();
        })
            .catch(function (error) {
            cb(error);
        });
    });
});
//# sourceMappingURL=getSchema.test.js.map