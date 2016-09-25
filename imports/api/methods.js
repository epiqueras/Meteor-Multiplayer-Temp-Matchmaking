/* eslint-disable import/no-extraneous-dependencies */
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
// eslint-disable-next-line import/no-unresolved
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

// Method that gets called from the router for temporary account functionality purposes.
// Removes the current user from the users database.
export const removeCurrentAccount = new ValidatedMethod({
  name: 'users.removeCurrentAccount',
  validate: new SimpleSchema({}).validator(),
  run() {
    return Meteor.users.remove(this.userId);
  },
});

export const setSocketId = new ValidatedMethod({
  name: 'users.setSocektId',
  validate: new SimpleSchema({
    socketId: { type: String },
  }).validator(),
  run(socketId) {
    return Meteor.users.update({ _id: this.userId }, { $set: { socketId: socketId.socketId } });
  },
});
