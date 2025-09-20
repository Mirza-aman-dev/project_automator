import { DataTypes } from "sequelize";

import sequelize from "../configs/connection.js";

const AppAccountServiceTypesModel = sequelize.define(
  "appAccountServiceTypes",
  {
    id: { type: DataTypes.UUID,primaryKey: true,  defaultValue: DataTypes.UUIDV4,},
    adminAppId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required 
    adminCustomerId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required //edit-fields //view-fields
    appAccountId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required  //edit-fields //view-fields

    typeName: { type: DataTypes.STRING, allowNull: false }, //create-required  //searchable  //updatable //table-fields  //edit-fields  //view-fields
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: "General" }, //searchable  //updatable //table-fields  //edit-fields  //view-fields
    note: { type: DataTypes.STRING, allowNull: true, defaultValue: "" }, //searchable  //updatable //table-fields  //edit-fields  //view-fields

    imagePath: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },  //view-fields

    status: {type: DataTypes.STRING,allowNull: false, defaultValue: "active",}, //table-fields  //status: active, inactive
    actionById: { type: DataTypes.UUID, allowNull: false },
    actionByName: { type: DataTypes.STRING, allowNull: false, defaultValue: "",},
    createdAt: {type: DataTypes.DATE,allowNull: false,defaultValue: DataTypes.NOW,},
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,},
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,},
  },
  {
    timestamps: false,
    tableName: "appAccountServiceTypes",
  }
);

export default AppAccountServiceTypesModel;
