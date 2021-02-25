// This script parse the data from the "trainer type" and "trainer encounters" datasets
// and creates a new JSON dataset that will be directly exploitable for the report

const assert = require("assert").strict;
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

// Parse files

const trainerTypeData = parse(fs.readFileSync("./data/trainer_types.csv"), {
  columns: true,
  skip_empty_lines: true,
  comment: "#",
});

const trainerEncountersRawStr = fs
  .readFileSync("./data/trainer_encounters.txt", {
    encoding: "utf-8",
  })
  // Remove intro
  .split("So here goes...")[1]
  .trimStart();

// Compute all encounters
// Note that trainer_encounter does not have a standard format
// So we do the parsing line by line

const trainerEncountersLines = trainerEncountersRawStr.split(/\r?\n/);
const nbOfLines = trainerEncountersLines.length;

const trainerEncounterData = [];
let currentZone = null;
let currentSubZone = null;
let currentTrainerType = null;
let currentHighestPokemonLevel = null;

for (let lineIdx = 0; lineIdx < nbOfLines; lineIdx += 1) {
  const line = trainerEncountersLines[lineIdx];

  // Zone names are followed by a line full of "*"
  if (/^\*+$/.test(line)) {
    currentZone = trainerEncountersLines[lineIdx - 1].trim();
    currentSubZone = null;
  }

  // Subzone names are followed by a line full of "-"
  if (/^\-+$/.test(line)) {
    currentSubZone = trainerEncountersLines[lineIdx - 1].trim();
  }

  // Pokemon lines ends with their level in the form LXX (where XX is the level)
  if (/^.*L\d+$/.test(line)) {
    // Pokemon line found!
    // Either the start of a trainer or the middle/end
    // Trainer lines contains one dash to separate the trainer position and the trainer type
    if (line.includes("-")) {
      // Start of a trainer found!
      currentTrainerType = line.match(/^.*\s-\s(.*?)\s{2,}/)[1];
    }

    const pokemonLevel = line.match(/.*L(\d+)$/)[1];
    if (pokemonLevel > currentHighestPokemonLevel) {
      currentHighestPokemonLevel = pokemonLevel;
    }
  }

  // Empty lines separate trainers
  // So when we reach one, we know that the current trainer can be stored
  if (line.trim().length === 0 && currentTrainerType) {
    trainerEncounterData.push({
      zone: currentZone,
      subZone: currentSubZone,
      trainerType: currentTrainerType,
      higherLevel: currentHighestPokemonLevel,
    });
    // reset current trainer data
    currentTrainerType = null;
    currentHighestPokemonLevel = null;
  }
}

// Enrich encounter data with trainer type data
let accMoneyMen = 0;
let accMoneyWomen = 0;
let accEncounterMen = 0;
let accEncounterWomen = 0;
const enrichedTrainerEncounterData = trainerEncounterData
  // Remove the Ghost (not a trainer, no prize money)
  .filter((elem) => elem.trainerType !== "Ghost")
  .map((elem) => {
    const trainerTypeEntry = trainerTypeData.find(
      (d) => d.Type === elem.trainerType
    );

    assert(!!trainerTypeEntry, `Unexpected type: ${elem.trainerType}`);

    // For logging, count how much time each type is accessed
    trainerTypeEntry.counter =
      typeof trainerTypeEntry.counter === "number"
        ? trainerTypeEntry.counter + 1
        : 1;

    const gender = trainerTypeEntry.Gender;

    accEncounterMen += gender === "M" ? 1 : 0;
    accEncounterWomen += gender === "F" ? 1 : 0;

    // Special case: Gary has a base prize of 99 when he is the Champion
    if (elem.trainerType === "Gary" && elem.zone.includes("Indigo")) {
      trainerTypeEntry.BasePrizeMoney = 99;
    }

    const prize =
      Number(trainerTypeEntry.BasePrizeMoney) * Number(elem.higherLevel);

    assert.match(gender, /[MF]/, `Unexpected gender: ${gender}`);

    accMoneyMen += gender === "M" ? prize : 0;
    accMoneyWomen += gender === "F" ? prize : 0;

    return {
      ...elem,
      gender,
      prize,
      accEncounterMen,
      accEncounterWomen,
      accMoneyMen,
      accMoneyWomen,
    };
  });

fs.writeFileSync(
  "./data/combined_out.json",
  JSON.stringify(enrichedTrainerEncounterData, null, 2)
);

/*
console.log(
  "un-gendered trainers?",
  enrichedTrainerEncounterData
    .filter((elem) => elem.gender !== "M" && elem.gender !== "F")
    .map((elem) => elem.trainerType)
    .sort()
);

console.log(
  "uncounted types",
  trainerTypeData.filter((e) => !e.counter)
);
*/

console.log("Combined", enrichedTrainerEncounterData.length, "encounters");

const moneyFromWomen = enrichedTrainerEncounterData
  .filter((e) => e.gender === "F")
  .reduce((accPrize, curEncounter) => accPrize + curEncounter.prize, 0);

const moneyFromMen = enrichedTrainerEncounterData
  .filter((e) => e.gender === "M")
  .reduce((accPrize, curEncounter) => accPrize + curEncounter.prize, 0);

console.log("Men $", moneyFromMen);
console.log("Women $", moneyFromWomen);
