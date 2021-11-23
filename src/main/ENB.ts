import fs from "fs";
import { logger } from "@/main/logger";
import {
  skyrimDirectory,
  USER_PREFERENCE_KEYS,
  userPreferences,
} from "@/main/config";
import { copy } from "fs-extra";
import { not as isNotJunk } from "junk";

const ENBDirectory = () =>
  `${userPreferences.get(USER_PREFERENCE_KEYS.MOD_DIRECTORY)}/ENB Presets`;

export const getENBPresets = async () =>
  (await fs.promises.readdir(ENBDirectory())).filter(isNotJunk);

/**
 * Get all ENB files from all presets.
 * Different presets can have different files,
 * this will list all possible files.
 */
const getAllPossibleENBFiles = async () => {
  const files = [];
  for (const preset of await getENBPresets()) {
    files.push(await fs.promises.readdir(`${ENBDirectory()}/${preset}`));
  }
  // Flatten and remove duplicates
  return new Set([...files.flat().filter(isNotJunk)]);
};

const getExistingENBFiles = async () => {
  const ENBFiles = await getAllPossibleENBFiles();
  return (await fs.promises.readdir(skyrimDirectory())).filter((file) =>
    ENBFiles.has(file)
  );
};

const getENBFilesForPreset = async (preset: string) =>
  fs.promises.readdir(`${ENBDirectory()}/${preset}`);

/**
 * Deletes all ENB files from the Skyrim directory.
 * Different ENB presets will contain different files,
 * so all presets need to be read to ensure everything is removed
 */
export const deleteAllENBFiles = async () => {
  logger.info("Deleting ENB Files");

  const existingENBFiles = await getExistingENBFiles();

  for (const file of existingENBFiles) {
    const fileWithPath = `${skyrimDirectory()}/${file}`;
    logger.debug(`Deleting ENB file ${file} with path ${fileWithPath}`);
    const isDirectory = (await fs.promises.lstat(fileWithPath)).isDirectory();
    await fs.promises.rm(fileWithPath, { recursive: isDirectory });
  }
};

export const copyENBFiles = async (profile: string) => {
  await deleteAllENBFiles();

  logger.info("Copying ENB Files");

  const ENBFiles = await getENBFilesForPreset(profile);

  for (const file of ENBFiles) {
    const fileWithPath = `${ENBDirectory()}/${profile}/${file}`;
    const fileDestination = `${skyrimDirectory()}/${file}`;
    logger.debug(`Copy ENB file ${file} with path ${fileWithPath}`);
    const isDirectory = (await fs.promises.lstat(fileWithPath)).isDirectory();

    if (isDirectory) {
      await copy(fileWithPath, fileDestination);
    } else {
      await fs.promises.copyFile(fileWithPath, fileDestination);
    }
  }
};

export const checkENBFilesExist = async () => {
  logger.info(`Checking if ENB files exist in ${ENBDirectory()}`);
  const existingENBFiles = await getExistingENBFiles();
  return existingENBFiles.length > 0;
};