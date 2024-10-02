import {
    type ApplicationCommandInteraction,
    type ReplyableInteraction,
    SlashCommand,
    UpdatableInteraction
} from "@barry-bot/core";
import {
    type BaseGuildSettingOption,
    type TypedGuildSettingOption,
    GuildSettingType
} from "../../config/option.js";
import type { BaseSettings } from "../../config/types.js";
import type { MainModule } from "../../main.js";

import {
    ComponentType,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits
} from "@discordjs/core";
import { ConfigurableModule } from "../../config/module.js";
import { timeoutContent } from "../../common.js";

import config, { type Emoji } from "../../config.js";

/**
 * Represents a slash command that manages the configuration of a guild.
 */
export default class extends SlashCommand<MainModule> {
    /**
     * Represents a slash command that manages the configuration of a guild.
     *
     * @param module The module the command belongs to.
     */
    constructor(module: MainModule) {
        super(module, {
            name: "config",
            description: "Manage the configuration of the bot for this server.",
            contexts: [InteractionContextType.Guild],
            defaultMemberPermissions: PermissionFlagsBits.ManageGuild
        });
    }

    /**
     * Let the user configure the bot for the guild.
     *
     * @param interaction The interaction that invoked the command.
     */
    async execute(interaction: ApplicationCommandInteraction): Promise<void> {
        if (!interaction.isInvokedInGuild()) {
            return;
        }

        
        await this.showModule(interaction, "main");
    }

    /**
     * Returns the emoji for the specified setting.
     *
     * @param option The option to get the emoji for.
     * @param value The value of the setting.
     * @returns The emoji for the setting.
     */
    getEmoji(option: BaseGuildSettingOption<any>, value?: unknown): Emoji {
        if (value === null) {
            return config.emotes.unknown;
        }

        if ("type" in option) {
            if (option.type === GuildSettingType.ChannelArray) {
                return config.emotes.channel;
            }

            if (option.type === GuildSettingType.Role || option.type === GuildSettingType.RoleArray) {
                return config.emotes.role;
            }
        }

        return config.emotes.add;
    }

    /**
     * Shows the configuration for the specified module.
     *
     * @param interaction The interaction that invoked the command.
     * @param moduleID The ID of the module to show the configuration for.
     * @param cache The cache for the settings.
     * @returns The settings of the module.
     */
    async showModule(interaction: ReplyableInteraction, moduleID: string): Promise<void> {
        if (!interaction.isInvokedInGuild()) {
            return;
        }

        const module = this.client.modules.get(moduleID);
        if (module === undefined) {
            throw new Error(`Module '${moduleID}' not found.`);
        }

        if (!(module instanceof ConfigurableModule)) {
            throw new Error(`Module '${moduleID}' is not configurable.`);
        }

        const embedOptions = [];
        const selectOptions = [];

        const options = module.getConfig();
        for (let i = 0; i < options.length; i++) {
            const option = options[i] as TypedGuildSettingOption<any, BaseSettings, keyof BaseSettings>;

            const value = await option.get(interaction.guildID);
            const emoji = this.getEmoji(option, value);

            selectOptions.push({
                description: option.description,
                emoji: {
                    animated: emoji.animated,
                    id: emoji.id,
                    name: emoji.name
                },
                label: option.name,
                value: i.toString()
            });

            const formatted = await option.onView(option, interaction);
            embedOptions.push({
                emoji: emoji,
                name: option.name,
                value: formatted
            });
        }

        const respond = interaction instanceof UpdatableInteraction
            ? interaction.editParent.bind(interaction)
            : interaction.createMessage.bind(interaction);

        await respond({
            components: [{
                components: [{
                    custom_id: "config-key",
                    options: selectOptions,
                    placeholder: "Select an option.",
                    type: ComponentType.StringSelect
                }],
                type: ComponentType.ActionRow
            }],
            content: `### ${config.emotes.add} Select an option to configure.`,
            embeds: [{
                description: "To configure a setting, select an option from the dropdown below.\n\n"
                    + embedOptions.map((o) => `${o.emoji} **${o.name}**: ${o.value}`).join("\n"),
                title: "Configuration"
            }],
            flags: MessageFlags.Ephemeral
        });

        const response = await interaction.awaitMessageComponent({
            customIDs: ["config-key"]
        });

        if (!response?.data.isStringSelect()) {
            const respond = interaction instanceof UpdatableInteraction
                ? interaction.editParent.bind(interaction)
                : interaction.editOriginalMessage.bind(interaction);

            await respond(timeoutContent);
            return;
        }

        const key = response.data.values[0];
        const option = options[Number(key)] as TypedGuildSettingOption<any, BaseSettings, keyof BaseSettings>;

        if (response.isInvokedInGuild()) {
            await option.onEdit(option, response);
        }

        await this.showModule(response, moduleID);
    }
}
