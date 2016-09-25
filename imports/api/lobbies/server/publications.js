/* eslint-disable prefer-arrow-callback */
/* eslint-disable import/no-extraneous-dependencies */
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Streamy } from 'meteor/yuukan:streamy';
import { Lobbies, Rooms, Leaderboard } from '../lobbies.js'; // eslint-disable-line no-unused-vars

import { allocateInLobby } from '../methods.js';

Meteor.publish('lobbies', function publishAllLobbies() {
  // Calls allocate method and stores user values for use in on stop.
  allocateInLobby.call({ userId: this.userId });
  const thisUserId = this.userId;
  const thisPlayer = {
    userId: thisUserId,
    name: Meteor.users.findOne({ _id: thisUserId }).username,
  };
  const userLobbyId = Meteor.users.findOne({ _id: thisUserId }).currentLobby;

  // This block will run when the user stops the subscription.
  this.onStop(function onGameLeave() {
    // Removes player from lobby when he leaves and set lobbyFull to false if set to true.
    Lobbies.update(userLobbyId, { $pull: { players: thisPlayer } });
    const currentLobby = Lobbies.findOne({ _id: userLobbyId });
    if (currentLobby.lobbyFull === true) {
      Lobbies.update(userLobbyId, { $set: { lobbyFull: false } });
    }

    // Removes lobby if no players are left.
    if (currentLobby.players.length === 0) {
      Lobbies.remove(userLobbyId);
    }

    // Removes player for temporary accounts functionality.
    Meteor.users.update({ _id: thisUserId }, { $set: { currentLobby: '' } });
    Meteor.users.remove(thisUserId);

    // Extra failsafe to make sure user gets removed from database.
    // Probably doesn't even work.
    FlowRouter.go('Home.login');
  });

  return Lobbies.find({ _id: userLobbyId });
});

Meteor.publish('rooms', function publishUserRoom(sid) {
  if (!sid) {
    return this.error(new Meteor.Error('sid null'));
  }

  return Streamy.Rooms.allForSession(sid);
});

Meteor.publish('leaderboard', function publishUserCurrentLobby() {
  return Leaderboard.find({}, {
    fields: { name: 1, score: 1 },
    sort: { score: -1 },
    limit: 10,
  });
});

Meteor.publish('userLobbyData', function publishUserCurrentLobby() {
  return Meteor.users.find({ _id: this.userId }, { fields: { currentLobby: 1, socketId: 1 } });
});
