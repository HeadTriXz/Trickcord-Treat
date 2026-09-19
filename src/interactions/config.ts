import type { InteractionHandler } from "./router.js";
import type { GuildSettingsUpdateInput } from "../database/repositories/index.js";

import { createConfigMessage, createConfigModal } from "../components/config.js";
import { SettingKind, getSetting, parseInteger } from "../core/settings.js";
import { replyEphemeral } from "./respond.js";
import { config } from "../config.js";

/**
 * Handles the settings overview's Edit buttons and their submitted modals.
 */
export const configHandler: InteractionHandler = {
    scope: "config",
    execute: async (ctx, interaction, id) => {
        if (!interaction.inCachedGuild()) {
            return;
        }

        if (id.action === "edit" && interaction.isButton()) {
            const descriptor = getSetting(id.args[0] ?? "");
            if (descriptor === undefined) {
                return;
            }

            const settings = await ctx.repositories.settings.getOrCreate(interaction.guildId);
            await interaction.showModal(createConfigModal(descriptor, settings));
            return;
        }

        if (id.action === "submit" && interaction.isModalSubmit()) {
            const descriptor = getSetting(id.args[0] ?? "");
            if (descriptor === undefined) {
                return;
            }

            const patch: GuildSettingsUpdateInput = {};
            switch (descriptor.kind) {
                case SettingKind.Integer:
                    patch[descriptor.key as "chance" | "interval" | "timeout"] = parseInteger(descriptor, interaction.fields.getTextInputValue(descriptor.key));
                    break;
                case SettingKind.Role:
                    patch.roleID = interaction.fields.getSelectedRoles(descriptor.key, false)?.first()?.id ?? null;
                    break;
                case SettingKind.Roles:
                    patch[descriptor.key as "ignoredRoles"] = [...(interaction.fields.getSelectedRoles(descriptor.key, false)?.keys() ?? [])];
                    break;
                case SettingKind.Channels:
                    patch[descriptor.key as "allowedChannels" | "ignoredChannels"] = [...(interaction.fields.getSelectedChannels(descriptor.key, false)?.keys() ?? [])];
                    break;
            }

            const updated = await ctx.repositories.settings.update(interaction.guildId, patch);
            if (interaction.isFromMessage()) {
                const message = createConfigMessage(updated);
                await interaction.update(message);
            } else {
                await replyEphemeral(interaction, `${config.emojis.check} Saved.`);
            }
        }
    }
};
