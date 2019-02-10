const { DiscordCommand } = require('../../../core');

const larg = require('larg');

module.exports = class Prefix extends DiscordCommand {
  constructor(bot) {
    super(bot, {
      name       : 'prefix',
      syntax     : 'prefix <..prefix:string> <-u|-g>',
      aliases    : [],
      argument   : [ '<...prefix:string>', '-<u|g>' ],
      description: 'Change your prefix',

      hidden     : false,
      enabled    : true,
      cooldown   : 1000,
      category   : 'Core',
      ownerOnly  : false,
      guildOnly  : false,
      permissions: [ 'embedLinks' ]
    });
  }

  async execute(msg, args, user, guild) {
    if (!user || user === null) user = await this.bot.m.connection.collection('dUsers').findOne({ userId: msg.author.id });
    if (!guild || guild === null) guild = await this.bot.m.connection.collection('dGuilds').findOne({ guildId: msg.channel.guild.id });

    // Delete all empty elements in `args`
    args = args.filter((v) => {
      return v.length >= 1;
    });
    // Avoid an `undefined` prefix
    if (!user || !user.prefix) {
      user.prefix = this.bot.conf.discord.prefix;
    }
    if (!user || !guild.prefix) {
      guild.prefix = this.bot.conf.discord.prefix;
    }
    
    if (args.join(' ').endsWith('-u') || args.join(' ').endsWith('--user')) {
      /* User prefix */
      let prefix = args.splice(0, 1).join(' ').slice(0, 32).toLowerCase();
      // Checks
      if (prefix.length <= 0) prefix = this.bot.conf.discord.prefix;
      if (user.prefix === prefix) {
        return msg.channel.createMessage(this.localize(msg.author.locale['core']['prefix']['dupe'], { uPrefix: user.prefix }));
      }
      // Update document
      this.bot.m.connection.collection('dUsers').findOneAndUpdate({ 'userId': user.userId }, { $set: { prefix: prefix } }, (err) => {
        if (err) throw err;
        });
      // Update user's entry in cache
      const entry = this.bot.cache.get('users').filter((v) => v.userId = msg.author.id)[0];
      if (entry) {
        entry.prefix = prefix;
      }

      msg.channel.createMessage(this.localize(msg.author.locale['core']['prefix']['changed'], { uPrefix: prefix }));
    } else if (args.join(' ').includes('-g') || args.join(' ').includes('--guild')) {
      /* Guild prefix */
      let prefix  = args.splice(0, 1).join(' ').slice(0, 32).toLowerCase();
      const uPerm = msg.channel.permissionsOf(msg.author.id);
      // Checks
      if (prefix.length <= 0) prefix = this.bot.conf.discord.prefix;
      if (!uPerm.has('manageGuild')) {
        return msg.channel.createMessage(this.localize(msg.author.locale['core']['prefix']['gperms']));
      }
      if (guild.prefix === prefix) {
        return msg.channel.createMessage(this.localize(msg.author.locale['core']['prefix']['gdupe'], { gPrefix: guild.prefix }));
      }
      // Update document
      this.bot.m.connection.collection('dGuilds').findOneAndUpdate({ 'guildId': guild.guildId }, { $set: { prefix: prefix } }, (err) => {
        if (err) throw err;
      });
      // Update guild's entry in cache
      const entry = this.bot.cache.get('guilds').filter((v) => v.guildId = msg.channel.guild.id)[0];
      if (entry) {
        entry.prefix = prefix;
      }

      msg.channel.createMessage(this.localize(msg.author.locale['core']['prefix']['gchanged'], { gPrefix: prefix }));
    } else {
      return msg.channel.createMessage({
        embed: {
          color      : this.bot.col['core']['prefix'],
          description: this.localize(msg.author.locale['core']['prefix']['info'].join('\n'), { uPrefix: user.prefix || this.bot.conf.discord.prefix, gPrefix: guild.prefix || this.bot.conf.discord.prefix })
        }
      });
    }
  }

  localize(msg, extData) {
    if (!msg) return '';
    // Optional replacements
    if (extData) {
      if (extData.uPrefix) {
        msg = msg.replace(/\$\[user:prefix]/g, extData.uPrefix);
      }
      if (extData.gPrefix) {
        msg = msg.replace(/\$\[guild:prefix]/g, extData.gPrefix);
      }
    }

    return msg
      .replace(/\$\[prefix:changeCmd]/g, this.extData.syntax)
      .replace(/\$\[emoji#0]/g, this.bot.emote('core', 'prefix', '0'))
      .replace(/\$\[emoji#1]/g, this.bot.emote('core', 'prefix', '1'))
      .replace(/\$\[emoji#2]/g, this.bot.emote('core', 'prefix', '2'))
      .replace(/\$\[emoji#3]/g, this.bot.emote('core', 'prefix', '3'))
      .replace(/\$\[emoji#4]/g, this.bot.emote('core', 'prefix', '4'))
      .replace(/\$\[emoji#5]/g, this.bot.emote('core', 'prefix', '5'))
      .replace(/\$\[emoji#6]/g, this.bot.emote('core', 'prefix', '6'))
      .replace(/\$\[emoji#7]/g, this.bot.emote('core', 'prefix', '7'));
  }
};