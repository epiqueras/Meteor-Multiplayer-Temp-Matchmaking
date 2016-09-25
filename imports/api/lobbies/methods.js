/* eslint-disable import/no-extraneous-dependencies */
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
// eslint-disable-next-line import/no-unresolved
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Lobbies, Leaderboard } from './lobbies.js';

// Get's called when user subscribes to lobbies.
// Loops through lobbies and places user in an empty one.
export const allocateInLobby = new ValidatedMethod({
  name: 'lobbies.allocateInLobby',
  validate: new SimpleSchema({
    userId: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),
  run(userId) {
    const lobbyMaxCap = 4;
    const id = userId.userId;
    const thisPlayer = {
      userId: id,
      name: Meteor.users.findOne({ _id: id }).username,
    };
    let protection = 0;
    while (protection < 1000000) {
      const emptyLobby = Lobbies.findOne({ lobbyFull: false }, { sort: { createdAt: -1 } });
      if (emptyLobby) {
        const emptyLobbyId = emptyLobby._id; // eslint-disable-line no-underscore-dangle
        Meteor.users.update({ _id: id }, { $set: { currentLobby: emptyLobbyId } });
        // console.log(Meteor.users.findOne({ _id: id }).currentLobby);
        if (emptyLobby.players.length + 1 >= lobbyMaxCap) {
          Lobbies.update(emptyLobbyId, { $set: { lobbyFull: true } });
        }
        return Lobbies.update(emptyLobbyId, { $push: { players: thisPlayer } });
      }
      Lobbies.insert({ players: [] });
      protection++;
    }
    return null;
  },
});

export const recordScore = new ValidatedMethod({
  name: 'leaderboard.recordScore',
  validate: new SimpleSchema({
    name: { type: String },
    score: { type: Number },
  }).validator(),
  run(data) {
    Leaderboard.insert({ name: data.name, score: data.score });
  },
});
