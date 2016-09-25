/* eslint-disable import/no-extraneous-dependencies */
import { Mongo } from 'meteor/mongo';
// eslint-disable-next-line import/no-unresolved
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Streamy } from 'meteor/yuukan:streamy';

// Custom lobbies collection class.
class LobbiesCollection extends Mongo.Collection {
  insert(doc, callback) {
    const lobby = doc;
    lobby.number = Lobbies.find({}).count() + 1; // eslint-disable-line no-use-before-define
    lobby.createdAt = new Date();
    const result = super.insert(lobby, callback);
    return result;
  }
  update(selector, modifier) {
    const result = super.update(selector, modifier);
    return result;
  }
  remove(selector) {
    const result = super.remove(selector);
    return result;
  }
}

// Creates the lobbies collection and the stream rooms.
export const Lobbies = new LobbiesCollection('Lobbies');
export const Leaderboard = new Mongo.Collection('Leaderboard');
export const Rooms = Streamy.Rooms.model;

Streamy.Rooms.onJoin = function onRoomJoin(roomName, socket) {
  Streamy.rooms(roomName).emit('__join__', {
    sid: Streamy.id(socket),
    room: roomName,
  });
};

Streamy.Rooms.onLeave = function onRoomLeave(roomName, socket) {
  Streamy.rooms(roomName).emit('__leave__', {
    sid: Streamy.id(socket),
    room: roomName,
  });
};

// Deny all client collection modifications.
Lobbies.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
Leaderboard.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

// Define player schema.
const playerSchema = new SimpleSchema({
  userId: { type: String, regEx: SimpleSchema.RegEx.Id },
  name: { type: String },
});

// Define the Lobbies schema.
Lobbies.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  number: { type: Number },
  createdAt: { type: Date },
  lobbyFull: { type: Boolean, defaultValue: false },
  players: { type: [playerSchema] },
});

// Attach the schema.
Lobbies.attachSchema(Lobbies.schema);

// Define the Lobbies schema.
Leaderboard.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  name: { type: String },
  score: { type: Number },
});

// Attach the schema.
Leaderboard.attachSchema(Leaderboard.schema);
