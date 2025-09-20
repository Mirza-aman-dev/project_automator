import { DataTypes } from "sequelize";

import sequelize from "../configs/connection.js";

const AppAccountProductsModel = sequelize.define(
  "appAccountProducts",
  {
    id: { type: DataTypes.UUID,primaryKey: true,  defaultValue: DataTypes.UUIDV4,},
    adminAppId: { type: DataTypes.UUID, allowNull: false }, //forign-key  //create-required 
    adminCustomerId: { type: DataTypes.UUID, allowNull: false }, //forign-key  //create-required //edit-field //view-field
    appAccountId: { type: DataTypes.UUID, allowNull: false }, //forign-key //create-required  //edit-field //view-field

    productCode: { type: DataTypes.STRING, allowNull: false }, //unique-by:appAccountId  //create-required  //searchable  //updatable //table-field  //edit-field  //view-field
    productName: { type: DataTypes.STRING, allowNull: false }, //unique-by:appAccountId  //create-required  //searchable  //updatable //table-field  //edit-field  //view-field
    productType: { type: DataTypes.STRING, allowNull: false}, //values:item, service, serialized //create-required  //searchable //table-field //view-field
    productPrice: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0.0 }, //create-required //updatable //table-field  //edit-field  //view-field
    note: { type: DataTypes.STRING, allowNull: true, defaultValue: "" }, //searchable  //updatable //table-field  //edit-field  //view-field

    reorderPoint: { type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: 0.0 }, //updatable //table-field  //edit-field  //view-field

    appAccountServiceTypeId: { type: DataTypes.UUID, allowNull: true, defaultValue: null }, //forign-key  //updatable //table-field  //edit-field  //view-field

    imagePath: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },  //view-field

    status: {type: DataTypes.STRING,allowNull: false, defaultValue: "active",}, //table-field  //values: active, inactive
    actionById: { type: DataTypes.UUID, allowNull: false },
    actionByName: { type: DataTypes.STRING, allowNull: false, defaultValue: "",},
    createdAt: {type: DataTypes.DATE,allowNull: false,defaultValue: DataTypes.NOW,},
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,},
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,},
  },
  {
    timestamps: false,
    tableName: "appAccountProducts",
  }
);

export default AppAccountProductsModel;
