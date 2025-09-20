import { DataTypes } from "sequelize";

import sequelize from "../configs/connection.js";
import { getRandomNumber8Digit } from "../utils/random.js";

const AppAccountUsersChangesModel = sequelize.define(
  "appAccountUserChanges",
  {
    itemId: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    actionAt: { type: DataTypes.DATE, primaryKey: true, allowNull: false, defaultValue: DataTypes.NOW },
    randomNumber: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, defaultValue: getRandomNumber8Digit },

    actionType: { type: DataTypes.STRING, allowNull: false },
    changeArray: { type: DataTypes.JSON, allowNull: true },

    actionById: { type: DataTypes.UUID, allowNull: false },
    actionByName: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: false,
    tableName: "appAccountUserChanges",
  }
);

export default AppAccountUsersChangesModel;
