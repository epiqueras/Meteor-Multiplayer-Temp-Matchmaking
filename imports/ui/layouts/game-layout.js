/* eslint-disable import/no-extraneous-dependencies */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Streamy } from 'meteor/yuukan:streamy';

import './game-layout.html';

import { setSocketId } from '../../api/methods.js';

Template.Game_layout.onCreated(function appBodyOnCreated() {
  // Waits for user to finish logging in.
  while (Meteor.loggingIn()) {
    if (!Meteor.loggingIn()) {
      break;
    }
  }

  // Set sockedId for future reference.
  setSocketId.call({ socketId: Streamy.id() });

  // Subscribes to lobbies and streams.
  this.subscribe('lobbies');
  this.subscribe('rooms', Streamy.id());
  this.subscribe('userLobbyData');
});
