import sequelize from "../configs/connection.js";
import { DataTypes, } from "sequelize";

const AppAccountModel = sequelize.define(
  "appAccounts",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    adminAppId: { type: DataTypes.UUID, allowNull: false }, // forign key
    adminCustomerId: { type: DataTypes.UUID, allowNull: false }, // forign key //create-required //edit-fields //view-fields //table-fields 
    title: { type: DataTypes.STRING, allowNull: false }, //create-required //edit-fields //view-fields //table-fields //searchable //updatable
    status: { type: DataTypes.STRING, allowNull: false }, //status: active, inactive
    actionById: { type: DataTypes.UUID, allowNull: false },
    actionByName: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    timestamps: false,
    tableName: "appAccounts",
    indexes: [
      {
        name: "idx_appAccounts_isDeleted_status_updatedAt",
        fields: ["isDeleted", "status", "updatedAt"],
      },
    ],
  }
);

export default AppAccountModel;

