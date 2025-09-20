import { Op, QueryTypes } from "sequelize";
import sequelize from "../configs/connection.js";

import AppAccountServiceTypesModel from "../models/app-account-service-types-model.js";
import { appAccountServiceTypesChangesCreateCtrl } from "./app-account-service-types-changes-ctrl.js";
import { sanitiseInput } from "../utils/sanitise-input.js";
import { graphqlPubsub } from "../gql-server/pubsub.js";
import { hasPermission } from "../redis/app-account-users-redis.js";
import jsonDiffArrayAction from "../services/json-diff-array-action.js";
import { appAccountsGetOneByIdCtrl } from "./app-accounts-ctrl.js";

const statusArray = ["any", "active", "inactive"];

const SELECT_QUERY = `
    SELECT appAccountServiceTypes.*,
    adminApps.name as adminAppName,
    adminCustomers.name as adminCustomerName,
    appAccounts.title as appAccountTitle
    FROM appAccountServiceTypes
     INNER JOIN adminApps
     ON adminApps.id = appAccountServiceTypes.adminAppId
        INNER JOIN adminCustomers   
        ON adminCustomers.id = appAccountServiceTypes.adminCustomerId
          INNER JOIN appAccounts
          ON appAccounts.id = appAccountServiceTypes.appAccountId
`;

// ---------- helper functions ----------

// Helper function to check type name uniqueness by appAccountId
const checkTypeNameUniqueness = async (typeName, appAccountId, excludeId = null) => {
  const whereClause = {
    typeName,
    appAccountId,
    isDeleted: false,
  };

  // Exclude current record when updating
  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }

  const existingServiceType = await AppAccountServiceTypesModel.findOne({
    where: whereClause,
  });

  return existingServiceType;
};

// Helper function to check for soft-deleted service types by type name and appAccountId
const checkSoftDeletedServiceType = async (typeName, appAccountId) => {
  const existingDeletedServiceType = await AppAccountServiceTypesModel.findOne({
    where: {
      typeName,
      appAccountId,
      isDeleted: true,
    },
  });

  return existingDeletedServiceType;
};

// Helper function to restore a soft-deleted service type with new details
const restoreSoftDeletedServiceType = async (
  existingDeletedServiceType,
  { typeName, category, imagePath, note, status = "active", actionById, actionByName },
  { transaction } = {}
) => {
  const sanitisedData = sanitiseInput({ typeName, category, note });

  const restoredServiceType = {
    ...existingDeletedServiceType.dataValues,
    typeName: sanitisedData.typeName,
    category: sanitisedData.category || "General",
    imagePath: imagePath || "",
    note: sanitisedData.note || "",
    status: status === "inactive" ? "active" : status,
    isDeleted: false,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const updatedServiceType = await AppAccountServiceTypesModel.update(restoredServiceType, {
    where: { id: existingDeletedServiceType.id },
    transaction,
  });

  if (updatedServiceType[0] > 0) {
    const changeArray = [];

    // Create change record
    await appAccountServiceTypesChangesCreateCtrl({
      itemId: existingDeletedServiceType.id,
      actionType: "restore",
      changeArray,
      actionById,
      actionByName,
    });

    publishChange(restoredServiceType, "restore", changeArray);
    return restoredServiceType;
  }

  throw new Error("Error: Failed to restore service type");
};

// Helper function to publish subscription events
const publishChange = (item, actionType, changeArray) => {
  const subscriptionTopic = `appAccountServiceType_${item.appAccountId}`;
  graphqlPubsub.publish(subscriptionTopic, {
    appAccountServiceTypeChanges: {
      item,
      actionType,
      changeArray,
    },
  });
};

// ---------- queries ----------

export const appAccountServiceTypesGetOneByIdCtrl = async (id) => {
  const sql = `
    ${SELECT_QUERY}
    WHERE appAccountServiceTypes.id = :id
    LIMIT 1;
     `;

  const [one] = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { id },
  });

  return one;
};

export const appAccountServiceTypesGetPagedDataByAccountUserCtrl = async ({
  appAccountId,
  pageType = "next",
  pageLimit = 500,
  lastUpdatedAt = null,
  searchText = "",
  status = "any",
}) => {
  if (!appAccountId) {
    throw new Error("ValidationError: appAccountId is required");
  }

  if (!statusArray.includes(status)) {
    throw new Error("ValidationError: Invalid status");
  }

  const pageTypes = ["previous", "next"];

  if (!pageTypes.includes(pageType)) {
    throw new Error("appAccountServiceTypesGetPagedDataByAccountUserCtrl: Invalid page type");
  }

  let query = " WHERE appAccountServiceTypes.isDeleted = 0 AND appAccountServiceTypes.appAccountId = :appAccountId ";
  let order = "DESC";
  if (lastUpdatedAt) {
    if (pageType === "previous") {
      query += ` AND appAccountServiceTypes.updatedAt > '${lastUpdatedAt}' `;
      order = "ASC";
    } else {
      query += ` AND appAccountServiceTypes.updatedAt < '${lastUpdatedAt}' `;
    }
  }

  if (status !== "any") {
    query += ` AND appAccountServiceTypes.status = '${status}' `;
  }

  if (searchText !== "") {
    const searchTextSanitized = searchText.toLowerCase();
    query += ` AND (
      LOWER(appAccountServiceTypes.typeName) LIKE '%${searchTextSanitized}%'
      OR LOWER(appAccountServiceTypes.category) LIKE '%${searchTextSanitized}%'
      OR LOWER(appAccountServiceTypes.note) LIKE '%${searchTextSanitized}%'
    )`;
  }

  const sql = `
    ${SELECT_QUERY}
    ${query}
    ORDER BY appAccountServiceTypes.updatedAt ${order}
    LIMIT ${pageLimit}
  `;

  const results = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { appAccountId },
  });

  if (pageType === "previous") {
    results.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  return results;
};

// ---------- mutations ----------

export const appAccountServiceTypesCreateCtrl = async (
  { appAccountId, typeName, category = "General", imagePath = "", note, status = "active", actionById, actionByName },
  { transaction } = {}
) => {
  const sanitisedData = sanitiseInput({ typeName, category, note });

  if (!appAccountId) {
    throw new Error("ValidationError: invalid appAccountId");
  }
  if (!sanitisedData.typeName) {
    throw new Error("ValidationError: invalid typeName");
  }

  // permission check
  const permissionCheck = await hasPermission(actionById, appAccountId, ["account-admin"]);
  if (!permissionCheck) {
    throw new Error("PermissionError: You do not have permission to create service types for this account");
  }

  // Check type name uniqueness by appAccountId
  const existingServiceTypeWithName = await checkTypeNameUniqueness(sanitisedData.typeName, appAccountId);
  if (existingServiceTypeWithName) {
    throw new Error("ValidationError: Service type name already exists for this account");
  }

  // Check if there's a soft-deleted service type with the same name that can be restored
  const softDeletedServiceType = await checkSoftDeletedServiceType(sanitisedData.typeName, appAccountId);
  if (softDeletedServiceType) {
    // Restore the soft-deleted service type with new details
    return await restoreSoftDeletedServiceType(
      softDeletedServiceType,
      {
        typeName: sanitisedData.typeName,
        category: sanitisedData.category || "General",
        imagePath,
        note: sanitisedData.note || "",
        status,
        actionById,
        actionByName,
      },
      { transaction }
    );
  }

  const appAccountOne = await appAccountsGetOneByIdCtrl(appAccountId);
  if (!appAccountOne) {
    throw new Error("IntegrityError: appAccount not found");
  }

  // if not active
  if (appAccountOne.status !== "active") {
    throw new Error("IntegrityError: appAccount is not active");
  }

  const adminAppId = appAccountOne.adminAppId;
  const adminCustomerId = appAccountOne.adminCustomerId;

  const appAccountServiceType = {
    adminAppId,
    adminCustomerId,
    appAccountId,
    typeName: sanitisedData.typeName,
    category: sanitisedData.category || "General",
    imagePath: imagePath || "",
    note: sanitisedData.note || "",
    actionById,
    actionByName,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const newAppAccountServiceType = await AppAccountServiceTypesModel.create(appAccountServiceType, {
    transaction,
  });

  // Create change record
  await appAccountServiceTypesChangesCreateCtrl({
    itemId: newAppAccountServiceType.dataValues.id,
    actionType: "create",
    changeArray: [],
    actionById,
    actionByName,
  });

  // Publish change event
  publishChange(newAppAccountServiceType.dataValues, "create", []);

  return newAppAccountServiceType.dataValues;
};

export const appAccountServiceTypesUpdateCtrl = async ({ id, typeName, category, note, actionById, actionByName }) => {
  const sanitisedData = sanitiseInput({ typeName, category, note });

  if (!id) {
    throw new Error("ValidationError: id is required");
  }

  const existingItem = await appAccountServiceTypesGetOneByIdCtrl(id);

  // Check if AppAccountServiceTypes exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: AppAccountServiceTypes not found");
  }

  // permission check
  const permissionCheck = await hasPermission(actionById, existingItem.appAccountId, ["account-admin"]);
  if (!permissionCheck) {
    throw new Error("PermissionError: You do not have permission to update service types for this account");
  }

  // Check type name uniqueness if changing
  if (sanitisedData.typeName && sanitisedData.typeName !== existingItem.typeName) {
    const existingServiceTypeWithName = await checkTypeNameUniqueness(
      sanitisedData.typeName,
      existingItem.appAccountId,
      id
    );
    if (existingServiceTypeWithName) {
      throw new Error("ValidationError: Service type name already exists for this account");
    }
  }

  const appAccountServiceType = {
    ...existingItem,
    typeName: sanitisedData.typeName || existingItem.typeName,
    category: sanitisedData.category || existingItem.category,
    note: sanitisedData.note || "",
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountServiceTypesModel.update(appAccountServiceType, {
    where: { id },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError: AppAccountServiceTypes not updated");
  }

  const changeArray = jsonDiffArrayAction(existingItem, appAccountServiceType);

  // Create change record
  await appAccountServiceTypesChangesCreateCtrl({
    itemId: id,
    actionType: "update",
    changeArray,
    actionById,
    actionByName,
  });

  // Publish subscription event
  publishChange(appAccountServiceType, "update", changeArray);

  return appAccountServiceType;
};

// update status
export const appAccountServiceTypesUpdateStatusCtrl = async ({ id, status, actionById, actionByName }) => {
  if (!id) {
    throw new Error("Validation Error: ID is required.");
  }

  if (!["active", "inactive"].includes(status)) {
    throw new Error("Validation Error: Status is invalid.");
  }

  const existingItem = await appAccountServiceTypesGetOneByIdCtrl(id);

  // Check if service type exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: AppAccountServiceTypes not found");
  }

  // permission check
  const permissionCheck = await hasPermission(actionById, existingItem.appAccountId, ["account-admin"]);
  if (!permissionCheck) {
    throw new Error("PermissionError: You do not have permission to update service types for this account");
  }

  const updateAppAccountServiceType = {
    ...existingItem,
    status,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountServiceTypesModel.update(updateAppAccountServiceType, {
    where: { id },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError: AppAccountServiceTypes is not updated.");
  }

  const changeArray = jsonDiffArrayAction(existingItem, updateAppAccountServiceType);

  // Create change record
  await appAccountServiceTypesChangesCreateCtrl({
    itemId: id,
    actionType: "update",
    changeArray,
    actionById,
    actionByName,
  });

  // Publish subscription event
  publishChange(updateAppAccountServiceType, "update", changeArray);

  return updateAppAccountServiceType;
};

// delete
export const appAccountServiceTypesDeleteCtrl = async ({ id, actionById, actionByName }) => {
  if (!id) {
    throw new Error("Validation Error: ID is required.");
  }

  const existingItem = await appAccountServiceTypesGetOneByIdCtrl(id);

  // Check if AppAccountServiceTypes exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: Missing Required fields");
  }

  // if not inactive
  if (existingItem.status !== "inactive") {
    throw new Error("IntegrityError: This service type is not inactive. Please deactivate the service type first.");
  }

  // if not active
  if (existingItem.status !== "inactive") {
    throw new Error("IntegrityError: This service type is not inactive. Please inactivate the service type first.");
  }

  // permission check
  const permissionCheck = await hasPermission(actionById, existingItem.appAccountId, ["account-admin"]);
  if (!permissionCheck) {
    throw new Error("PermissionError: You do not have permission to delete service types for this account");
  }

  const deleteAppAccountServiceType = {
    ...existingItem,
    isDeleted: true,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountServiceTypesModel.update(deleteAppAccountServiceType, {
    where: { id },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError: AppAccountServiceTypes is not deleted.");
  }

  const changeArray = jsonDiffArrayAction(existingItem, deleteAppAccountServiceType);

  // Create change record
  await appAccountServiceTypesChangesCreateCtrl({
    itemId: id,
    actionType: "delete",
    changeArray,
    actionById,
    actionByName,
  });

  // Publish subscription event
  publishChange(deleteAppAccountServiceType, "delete", changeArray);

  return deleteAppAccountServiceType;
};
