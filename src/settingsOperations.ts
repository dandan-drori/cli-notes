import { getSettings } from "./db/settings";
import { Settings } from "./models/settings";
import inquirer from "inquirer";
import { settingsQuestion, settingValueQuestion } from "./questions/settings";

export async function getUpdatedSettings(): Promise<Settings> {
    // add loop with option to quit?
    const settings = await getSettings();
    const choices = await getSettingsProperties(settings);
    const { settingName } = await inquirer.prompt([{...settingsQuestion, choices}]);
    const settingValuesChoices = getSettingValueOptionsByPropertyName(settingName);
    const { settingValue } = await inquirer.prompt([{...settingValueQuestion, choices: settingValuesChoices}]);
    // settings[settingName as keyof Settings] = settingValue;
    return settings;
}

export async function getSettingsProperties(settings: Settings): Promise<string[]> {
    return Object.keys(settings).filter((propertyName: string) => propertyName !== '_id');
}

function getSettingValueOptionsByPropertyName(settingName: Partial<keyof Settings>): string[] {
    const settingsValueOptions = {
        _id: [''],
        sortBy: ['createdAt', 'title', 'text'],
        sortDirection: ['asc', 'desc']
    };
    return settingsValueOptions[settingName];
}