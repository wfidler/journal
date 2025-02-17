const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

let sequelize;

function initializeDatabase(app) {
  if (!sequelize) {
    const databasePath = path.join(app.getPath("userData"), "journal.db");
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: databasePath,
      logging: false,
    });
    const Entry = require("./entry")(sequelize, DataTypes);
    const Tag = require("./tag")(sequelize, DataTypes);

    Entry.belongsToMany(Tag, { through: "JournalEntryTags" });
    Tag.belongsToMany(Entry, { through: "JournalEntryTags" });

    return { sequelize, Entry, Tag };
  }
}

module.exports = { initializeDatabase };
