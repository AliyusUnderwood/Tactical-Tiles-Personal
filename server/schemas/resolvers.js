const { AuthenticationError } = require('apollo-server-express');
const { User, Game } = require('../models');
const { signToken } = require('../utils/auth');
const { Chess } = require('chess.js');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findById(context.user.id);
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    game: async (parent, { id }, context) => {
      if (context.user) {
        return await Game.findById(id).populate('player');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
  Mutation: {
    signup: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    createGame: async (parent, args, context) => {
      if (context.user) {
        const game = new Chess();
        const newGame = await Game.create({
          player: context.user.id,
          currentBoard: game.fen(),
          status: 'IN_PROGRESS',
        });
        return newGame;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    makeMove: async (parent, { gameId, from, to }, context) => {
      if (context.user) {
        const game = await Game.findById(gameId);
        if (!game) {
          throw new Error('Game not found');
        }
        
        const chess = new Chess(game.currentBoard);
        const move = chess.move({ from, to, promotion: 'q' });
        
        if (move === null) {
          throw new Error('Invalid move');
        }

        game.currentBoard = chess.fen();
        if (chess.game_over()) {
          game.status = chess.in_checkmate() ? 'PLAYER_WON' : 'DRAW';
        }

        await game.save();
        return game;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;