"use strict";

const log = require('loglevel').getLogger('NotifyCommand'),
  Commando = require('discord.js-commando'),
  {CommandGroup} = require('../../app/constants'),
  Helper = require('../../app/helper'),
  Notify = require('../../app/notify'),
  settings = require('../../data/settings'),
  Utility = require('../../app/utility');

class NotifyCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'want',
      group: CommandGroup.NOTIFICATIONS,
      memberName: 'want',
      aliases: ['i-want', 'notify'],
      description: 'Adds notifications for a raid boss.',
      details: 'Use this command to request notifications for a specific raid boss.',
      examples: ['\t!want ttar'],
      args: [
        {
          key: 'pokemon',
          prompt: 'What pokémon do you wish to be notified for?\nExample: `lugia`\n',
          type: 'pokemon'
        }
      ],
      argsPromptLimit: 3,
      guildOnly: true
    });

    client.dispatcher.addInhibitor(message => {
      if (!!message.command && message.command.name === 'want' && !Helper.isBotChannel(message)) {
        return ['invalid-channel', message.reply(Helper.getText('notify.warning', message))];
      }
      return false;
    });
  }

  async run(message, args) {
    const pokemon = args['pokemon'];
    let type = 'both';

    if (pokemon.name !== 'perfect') {
      const typeCollector = new Commando.ArgumentCollector(message.client, [
          {
            key: 'type',
            prompt: 'Do you want spawn notifications, raid notifications, or both? Please respond with `spawn`, `raid` or `both`.',
            type: 'string',
            oneOf: ['spawn', 'raid', 'both']
          }
        ], 3),
        typeResult = await typeCollector.obtain(message);

      Utility.cleanCollector(typeResult);

      if (!typeResult.cancelled) {
        type = typeResult.values['type'];
      }
    } else {
      type = 'spawn';
    }

    Notify.assignPokemonNotification(message.member, pokemon, type)
      .then(result => message.react(Helper.getEmoji(settings.emoji.thumbsUp) || '👍'))
      .catch(err => log.error(err));
  }
}

module.exports = NotifyCommand;
