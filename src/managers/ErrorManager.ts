import { Client, MessageAttachment, MessageEmbed } from 'discord.js';
import { ErrorTicket } from '../structures/Interfaces.js';
import constants from '../utils/Constants.js';
import ProcessQueue from '../utils/ProcessQueue.js';

export default class ErrorManager {
  client: Client;
  queuer: ProcessQueue;
  threshold_hitcount: number;
  threshold_reached: boolean;
  errors: ErrorTicket[];

  constructor(client: Client) {
    this.client = client;
    this.queuer = new ProcessQueue();
    this.threshold_hitcount = 0;
    this.threshold_reached = false;
    this.errors = [];

    this.client.on('rateLimit', data => {
      this.client.message_manager.sendToChannel(
        `${constants.cs.channels.telemetry}`,
        {
          files: [
            new MessageAttachment('./src/assets/thumbnails/ratelimit_icon.png'),
          ],
          embeds: [
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Telemetry' },
              title: 'Client Rate Limit',
              thumbnail: {
                url: 'attachment://ratelimit_icon.png',
              },
              description: [
                `**Method:** ${data.method}`,
                `**Limit:** ${data.limit}`,
                `**Timeout:** ${data.timeout}`,
              ].join('\n'),
              footer: { text: data.route },
              color: '#1F85DE',
            }),
          ],
        },
      );
    });

    this.client.on('warn', message => {
      this.client.message_manager.sendToChannel(
        `${constants.cs.channels.telemetry}`,
        {
          files: [
            new MessageAttachment('./src/assets/thumbnails/warning_icon.png'),
          ],
          embeds: [
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Telemetry' },
              title: 'Client Warning',
              thumbnail: {
                url: 'attachment://warning_icon.png',
              },
              description: `**Message:** ${message}`,
              color: '#FFA721',
            }),
          ],
        },
      );
    });

    this.client.on('error', error => {
      this.client.message_manager.sendToChannel(
        `${constants.cs.channels.telemetry}`,
        {
          files: [
            new MessageAttachment('./src/assets/thumbnails/fatal_icon.png'),
          ],
          embeds: [
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Telemetry' },
              title: 'Client Error',
              thumbnail: {
                url: 'attachment://fatal_icon.png',
              },
              description: [
                `**Name:** ${error.name}`,
                `**Message:** ${error.message}`,
              ].join('\n'),
              color: '#FF0A0A',
            }),
          ],
        },
      );
    });
  }

  mark(error_ticket: ErrorTicket): Promise<void> {
    console.log(
      `ErrorManager: Queueing ${this.queuer.totalID} (${error_ticket.name} @${error_ticket.location}: ` +
        `${error_ticket.error})`,
    );

    return this.queuer.queue(() => {
      try {
        this.errors.push(error_ticket);
        setTimeout(() => {
          this.errors.shift();
          if (
            this.errors.length === 0 &&
            !this.errors.some(e => 'code' in e.error && e.error.code === 500)
          ) {
            this.threshold_reached = false;
          }
        }, 60000);

        const epm = this.errors.length;

        if (
          epm > 5 ||
          ('code' in error_ticket.error &&
            error_ticket.error.code !== null &&
            error_ticket.error.code === 500)
        ) {
          this.threshold_reached = true;
        }

        const embed = new MessageEmbed({
          author: { name: 'Quarantine Gaming: Telemetry' },
          title: 'Error Detection',
          thumbnail: {
            url: 'attachment://error_icon.png',
          },
          fields: [
            { name: 'Location', value: 'N/A', inline: true },
            { name: 'Method', value: 'N/A', inline: true },
            { name: 'Error Code', value: 'N/A', inline: true },
            { name: 'Error Message', value: 'N/A' },
          ],
          footer: {
            text: `Errors/Min: ${epm}    |    Threshold Hit: ${
              this.threshold_reached ? 'Yes' : 'No'
            }    |    Threshold Hit Count: ${this.threshold_hitcount}`,
          },
          color: '#FF0000',
        });

        embed.fields[0].value = error_ticket.location;
        embed.fields[1].value = error_ticket.name;
        embed.fields[3].value = String(error_ticket.error);
        if ('code' in error_ticket.error) {
          embed.fields[2].value = String(error_ticket.error.code);
        }

        return this.client.message_manager.sendToChannel(
          `${constants.cs.channels.telemetry}`,
          {
            files: [
              new MessageAttachment('./src/assets/thumbnails/error_icon.png'),
            ],
            embeds: [embed],
          },
        );
      } catch (error) {
        console.error(`ErrorManager: ${error}`);
      } finally {
        console.log(`ErrorManager: Finished ${this.queuer.currentID}`);
      }
    }) as Promise<void>;
  }
}
