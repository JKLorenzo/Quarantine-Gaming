import { MessageEmbed } from 'discord.js';
import { ErrorTicket } from '../structures/Interfaces.js';
import QGClient from '../structures/QGClient.js';
import constants from '../utils/Constants.js';
import ProcessQueue from '../utils/ProcessQueue.js';

export default class ErrorManager {
  client: QGClient;
  queuer: ProcessQueue;
  threshold_hitcount: number;
  threshold_reached: boolean;
  errors: ErrorTicket[];

  constructor(client: QGClient) {
    this.client = client;
    this.queuer = new ProcessQueue();
    this.threshold_hitcount = 0;
    this.threshold_reached = false;
    this.errors = [];
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
          thumbnail: { url: constants.images.error_message_thumbnail },
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
          { embeds: [embed] },
        );
      } catch (error) {
        console.error(`ErrorManager: ${error}`);
      } finally {
        console.log(`ErrorManager: Finished ${this.queuer.currentID}`);
      }
    }) as Promise<void>;
  }
}
