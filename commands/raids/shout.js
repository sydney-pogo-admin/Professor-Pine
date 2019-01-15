"use strict";

const log = require('loglevel').getLogger('ShoutCommand'),
  Commando = require('discord.js-commando'),
  {CommandGroup, PartyStatus} = require('../../app/constants'),
  Notify = require('../../app/notify'),
  PartyManager = require('../../app/party-manager');

class ShoutCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'shout',
      group: CommandGroup.BASIC_RAID,
      memberName: 'shout',
      aliases: ['yell'],
      description: 'Sends a message mentioning other attendees to the raid.',
      details: 'Use this command to send a message mentioning other attendees to the raid.',
      examples: ['\t!shout Gridlock on Forbes - take side streets instead!'],
      throttling: {
        usages: 3,
        duration: 180
      },
      guildOnly: true
    });

    client.dispatcher.addInhibitor(message => {
      if (!!message.command && message.command.name === 'new' &&
        !PartyManager.validParty(message.channel.id)) {
        return ['invalid-channel', message.reply('Create a new raid group for a raid from its raid channel!')];
      }
      return false;
    });
  }

  async run(message, text) {
    if (!text.length) {
      return;
    }

    const raid = PartyManager.getParty(message.channel.id),
      attendees = Object.entries(raid.attendees)
        .filter(([attendee, attendeeStatus]) => attendee !== message.member.id &&
          attendeeStatus.status !== PartyStatus.COMPLETE)
        .map(([attendee, attendeeStatus]) => attendee);

    if (attendees.length > 0) {
      const members = (await Promise.all(attendees
          .map(async attendee_id => await raid.getMember(attendee_id))))
          .filter(member => member.ok === true)
          .map(member => member.member),
        text_without_command_prefix = message.cleanContent.substr(1).trim(),
        fullyCleanText = text_without_command_prefix.substr(text_without_command_prefix.indexOf(' ') + 1);

      Notify.shout(message, members, fullyCleanText, 'shouts', message.member);
    }
  }
}

module.exports = ShoutCommand;
