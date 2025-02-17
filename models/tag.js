module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define("Tag", {
    tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Tag;
};
