import { getSettings } from "./db/settings";
import { Settings } from "./models/settings";
import inquirer from "inquirer";
import { settingsQuestion, settingValueQuestion } from "./questions/settings";
import { mainPasswordQuestion } from "./questions/settings/mainPassword";
import { getHashedPassword } from "./db/mongo";

export async function getUpdatedSettings(): Promise<Settings> {
    // TODO: add loop with option to quit?
    const settings = await getSettings();
    const choices = await getSettingsProperties(settings);
    const { settingName } = await inquirer.prompt([{...settingsQuestion, choices}]);
    const settingValuesChoices = getSettingValueOptionsByPropertyName(settingName);
    if (!settingValuesChoices.length) {
        const { mainPassword } = await inquirer.prompt(mainPasswordQuestion);
        const hashedPassword = await getHashedPassword(mainPassword);
        (settings as any)[settingName] = hashedPassword;
        return settings;
    }
    const { settingValue } = await inquirer.prompt([{...settingValueQuestion, choices: settingValuesChoices}]);
    (settings as any)[settingName] = settingValue;
    return settings;
}

export async function getSettingsProperties(settings: Settings): Promise<string[]> {
    return Object.keys(settings).filter((propertyName: string) => propertyName !== '_id');
}

function getSettingValueOptionsByPropertyName(settingName: Partial<keyof Settings>): string[] {
    const settingsValueOptions = {
        _id: [''],
        sortBy: ['createdAt', 'title', 'text'],
        sortDirection: ['asc', 'desc'],
        searchHighlightColor: ['red', 'blue', 'yellow', 'green', 'pink'],
        mainPassword: [],
    };
    return settingsValueOptions[settingName];
}