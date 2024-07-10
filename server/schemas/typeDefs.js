const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type Game {
    id: ID!
    player: User!
    currentBoard: String!
    status: GameStatus!
  }

  enum GameStatus {
    IN_PROGRESS
    PLAYER_WON
    AI_WON
    DRAW
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    game(id: ID!): Game
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createGame: Game!
    makeMove(gameId: ID!, from: String!, to: String!): Game!
  }
`;

module.exports = typeDefs;