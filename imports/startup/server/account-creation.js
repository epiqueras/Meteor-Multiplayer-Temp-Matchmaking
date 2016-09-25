/* eslint-disable import/no-extraneous-dependencies */
import { Accounts } from 'meteor/accounts-base';

// Customize user accounts with a currentLobby field.
Accounts.onCreateUser((options, user) => {
  user.currentLobby = ''; // eslint-disable-line no-param-reassign
  user.socketId = ''; // eslint-disable-line no-param-reassign
  return user;
});
