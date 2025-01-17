const { User, Game } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');
const { Game: ChessGame, move, status, getFen, aiMove } = require('js-chess-engine');

const difficultyMap = {
  'EASY': 1,
  'MEDIUM': 2,
  'HARD': 3,
  'EXPERT': 4
};

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('games');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    game: async (parent, { _id }, context) => {
      if (context.user) {
        return Game.findOne({ _id }).populate('player');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    myGames: async (parent, args, context) => {
      if (context.user) {
        return Game.find({ player: context.user._id }).populate('player');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user || !await user.isCorrectPassword(password)) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = signToken(user);
      return { token, user };
    },
    createGame: async (parent, { aiDifficulty }, context) => {
      if (context.user) {
        const chessGame = new ChessGame();
        const difficultyLevel = difficultyMap[aiDifficulty] || 2; // Default to MEDIUM if invalid
        const newGame = await Game.create({
          player: context.user._id,
          currentBoard: JSON.stringify(chessGame.exportJson()),
          aiDifficulty: difficultyLevel,
        });
        await User.findByIdAndUpdate(context.user._id, { $push: { games: newGame._id } });
        return newGame.populate('player');
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    deleteGame: async (parent, { _id }, context) => {
      if (context.user) {
        const deletedGame = await Game.findOneAndDelete({
          _id,
          player: context.user._id
        });

        if (!deletedGame) {
          throw new Error('Game not found or you do not have permission to delete it');
        }

        await User.findByIdAndUpdate(context.user._id, {
          $pull: { games: _id }
        });

        return deletedGame;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    makeMove: async (parent, { gameId, from, to }, context) => {
      if (context.user) {
        const game = await Game.findById(gameId);
        if (!game) throw new Error('Game not found');
    
        let boardState = JSON.parse(game.currentBoard);
        
        // Check if it's the player's turn
        if (boardState.turn.toLowerCase() !== 'white') {
          throw new Error("It's not your turn");
        }
        
        try {
          
          // Get the piece before the move
          const playerPiece = boardState.pieces[from];
          
          boardState = move(boardState, from, to);
          
          // Update game state with player's move
          game.currentBoard = JSON.stringify(boardState);
          
          game.moves.push({ 
            from, 
            to, 
            piece: playerPiece,
            timestamp: new Date() 
          });      
      
          // Check for game over after player's move
          const gameStatus = status(boardState);
          if (gameStatus.checkMate) {
            game.status = 'PLAYER_WON';
          } else if (gameStatus.isFinished) {
            game.status = 'DRAW';
          } else {
            // Make AI move
            const aiMoveResult = aiMove(boardState, game.aiDifficulty);
            
            const [[aiFrom, aiTo]] = Object.entries(aiMoveResult);
            
            // Get the AI piece before the move
            const aiPiece = boardState.pieces[aiFrom];
            
            boardState = move(boardState, aiFrom, aiTo);
            
            // Update game state with AI's move
            game.currentBoard = JSON.stringify(boardState);
            game.moves.push({ 
              from: aiFrom, 
              to: aiTo, 
              piece: aiPiece,
              timestamp: new Date() 
            });      
      
            // Check for game over after AI move
            const aiMoveStatus = status(boardState);
            if (aiMoveStatus.checkMate) {
              game.status = 'AI_WON';
            } else if (aiMoveStatus.isFinished) {
              game.status = 'DRAW';
            }
          }
        } catch (error) {
          console.error('Move error:', error);
          throw new Error(`Invalid move: ${error.message}`);
        }
    
        console.log('Moves before saving:', game.moves);

        try {
          await game.save();
        } catch (saveError) {
          console.error('Error saving game:', saveError);
          throw new Error(`Error saving game: ${saveError.message}`);
        }
        
        return game.populate('player');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Game: {
    isPlayerTurn: (parent) => {
      const boardState = JSON.parse(parent.currentBoard);
      return boardState.turn.toLowerCase() === 'white';
    },
  },
};

module.exports = resolvers;