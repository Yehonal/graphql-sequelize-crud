'use strict';
const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
} = require('graphql');

const {
  CustomGQLType
} = require("../src/types");

//import { ModelsHashInterface as Models } from "sequelize";
const Sequelize = require('sequelize');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const {
  express
} = require('graphql-playground/middleware');

const {
  getSchema,
  //ModelTypes,
} = require('../src');

const app = express();
const sequelize = new Sequelize('database', 'username', 'password', {
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
})

User.excludeFields = ["password"];
// User.onlyFields = ["email"]; inclusive filter as an alternative to excludeFields

/**
 * @param {Models} models
 * @param {ModelTypes} types
 */
User.queries = (models, types, resolver, queries) => {
  return {
    viewer: {
      type: types.User,
      description: "Get a User by username",
      args: {},
      resolve: (source, args, context) => {
        return Promise.resolve(null);
      },
    },
  };
};

User.mutations = (models, modelTypes, resolver, mutations) => {
  return {
    createCustom: {
      type: new GraphQLObjectType({
        name: "Custom",
        description: "Custom type for custom mutation",
        fields: () => ({
          customValueA: {
            type: GraphQLString,
          },
          customValueB: {
            type: GraphQLString,
          },
        })
      }),
      args: {
        dataA: {
          type: new GraphQLNonNull(GraphQLString)
        },
        dataB: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (obj, {
        dataA,
        dataB
      }) => {
        return Promise.resolve({
          customValueA: dataA,
          customValueB: dataB,
        });
      }
    }
  };
}

// tslint:disable-next-line:variable-name
const Todo = sequelize.define('Todo', {
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
const TodoAssignee = sequelize.define('TodoAssignee', {
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
  .then(() => {

    const schema = getSchema(sequelize);

    app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: true
    }));

    app.use('/playground', playground({
      endpoint: '/graphql'
    }));

    const port = 3000;
    app.listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log(`Listening on port ${port}`);
    });

  });