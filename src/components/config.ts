import type { GuildSettings } from "../database/schema.js";
import type { ComponentsV2Payload } from "./common.js";

import {
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    RoleSelectMenuBuilder,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import { SETTINGS, type SettingDescriptor, SettingKind, formatValue } from "../core/settings.js";
import { createContainer } from "./common.js";
import { buildId } from "../utils/customId.js";
import { config } from "../config.js";

/**
 * Builds the configuration overview: one section per setting with an Edit button.
 *
 * @param settings The guild's current settings.
 * @returns The message payload for the overview.
 */
export function createConfigMessage(settings: GuildSettings): ComponentsV2Payload {
    const container = createContainer()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("## Configuration"))
        .addSeparatorComponents(new SeparatorBuilder());

    for (const s of SETTINGS) {
        container.addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${config.emojis[s.emoji]} **${s.label}** · ${formatValue(s, settings)}\n-# ${s.description}`
            ))
            .setButtonAccessory(new ButtonBuilder()
                .setCustomId(buildId("config", "edit", s.key))
                .setLabel("Edit")
                .setStyle(ButtonStyle.Secondary)));
    }

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Builds the modal used to edit one setting. Leaving a select empty clears the setting.
 *
 * @param descriptor The setting being edited.
 * @param settings The guild's current settings, used to prefill the editor.
 * @returns The modal to show.
 */
export function createConfigModal(descriptor: SettingDescriptor, settings: GuildSettings): ModalBuilder {
    const clearable = descriptor.kind === SettingKind.Role
        || descriptor.kind === SettingKind.Roles
        || descriptor.kind === SettingKind.Channels;

    const description = clearable
        ? `${descriptor.description} Leave empty to clear.`
        : descriptor.description;

    const label = new LabelBuilder()
        .setLabel(descriptor.label)
        .setDescription(description);

    const value = settings[descriptor.key];

    switch (descriptor.kind) {
        case SettingKind.Integer:
            label.setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId(descriptor.key)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setValue(String(value))
            );
            break;
        case SettingKind.Role:
            label.setRoleSelectMenuComponent(
                createRoleSelect(descriptor.key, 1, value === null ? [] : [String(value)])
            );
            break;

        case SettingKind.Roles:
            label.setRoleSelectMenuComponent(createRoleSelect(descriptor.key, 25, value as string[]));
            break;

        case SettingKind.Channels: {
            const channels = value as string[];
            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId(descriptor.key)
                .setMinValues(0)
                .setMaxValues(25)
                .setRequired(false)
                .setChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement,
                    ChannelType.PublicThread,
                    ChannelType.PrivateThread,
                    ChannelType.GuildVoice
                );
            if (channels.length > 0) {
                channelSelect.setDefaultChannels(...channels);
            }

            label.setChannelSelectMenuComponent(channelSelect);
            break;
        }
    }

    return new ModalBuilder()
        .setCustomId(buildId("config", "submit", descriptor.key))
        .setTitle(`Edit ${descriptor.label}`)
        .addLabelComponents(label);
}

/**
 * Builds a role select menu, preselecting the given roles.
 *
 * @param customID The select menu's custom ID.
 * @param maxValues The maximum number of roles that can be selected.
 * @param defaults The role IDs to preselect.
 * @returns The role select menu.
 */
function createRoleSelect(customID: string, maxValues: number, defaults: string[]): RoleSelectMenuBuilder {
    const select = new RoleSelectMenuBuilder()
        .setCustomId(customID)
        .setMinValues(0)
        .setMaxValues(maxValues)
        .setRequired(false);

    if (defaults.length > 0) {
        select.setDefaultRoles(...defaults);
    }

    return select;
}
