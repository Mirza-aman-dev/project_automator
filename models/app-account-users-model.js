
import { DataTypes } from "sequelize";

import sequelize from "../configs/connection.js";

const AppAccountUsersModel = sequelize.define(
   "appAccountUsers",
    {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 }, // TODO: change to integer maybe
    adminAppId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required
    adminCustomerId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required //edit-fields  //view-fields
    appAccountId: { type: DataTypes.UUID, allowNull: false }, // forign key  //create-required //edit-fields  //view-fields
  
    userFullName: { type: DataTypes.STRING, allowNull: false, defaultValue: "" }, //create-required //searchable  //updatable //table-fields  //edit-fields  //view-fields
    userEmail: { type: DataTypes.STRING, allowNull: false, defaultValue: "" }, //create-required //searchable  //updatable //table-fields  //edit-fields  //view-fields
    contactNumber: { type: DataTypes.STRING, allowNull: false, defaultValue: "" }, //searchable  //updatable //edit-fields  //view-fields

    userRole: { type: DataTypes.STRING, allowNull: false, defaultValue: "" }, //create-required //searchable  //updatable //table-fields  //edit-fields  //view-fields //values: account-admin, account-user
    assignedGroupId: { type: DataTypes.UUID, allowNull: true, defaultValue: null },  //updatable //edit-fields

    note: { type: DataTypes.STRING, allowNull: true, defaultValue: "" }, //searchable  //updatable //edit-fields  //view-fields //text-area

    loginUserId: { type: DataTypes.UUID, allowNull: true, defaultValue: null },

    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "active" }, //table-fields  //status: active, inactive
    actionById: { type: DataTypes.UUID, allowNull: false },
    actionByName: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
   },
   {
    timestamps: false,
    tableName: "appAccountUsers",
  }
);

export default AppAccountUsersModel;
 