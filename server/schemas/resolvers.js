const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async () => {
            return User.find().sort({ createdAt: -1 });
        },

        me: async (parent, args, context) => {
            if(context.user){
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks')

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        }
    },

    Mutation: {
        createUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw){
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return {token, user};
        },

        saveBook: async (parent, {authors, description, bookId, image, link, title}, context) => {
            if(context.user) {
                const savedBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: { authors, description, bookId, image, link, title } } },
                    { new: true, runValidators: true }
                );

                return savedBook;
            }

            throw new AuthenticationError('You need to be logged in!');
        },

        deleteBook: async (parent, { bookId }, context) => {
            if(context.user) {
                const deletedBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );

                return deletedBook
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }
}

module.exports = resolvers;