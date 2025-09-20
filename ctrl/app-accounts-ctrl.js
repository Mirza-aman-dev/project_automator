import { QueryTypes, Op } from "sequelize";

import sequelize from "../configs/connection.js";
import AppAccountModel from "../models/app-accounts-model.js";
import AppAccountUsersModel from "../models/app-account-users-model.js";
import { getOne } from "../models/users-model.js";

import jsonDiffArrayAction from "../services/json-diff-array-action.js";
import { appAccountsChangesCreateCtrl } from "./app-accounts-changes-ctrl.js";

const SELECT_QUERY = `
                SELECT appAccounts.*,
                adminApps.name as adminAppName,
                adminCustomers.name as adminCustomerName    
                FROM appAccounts
                 INNER JOIN adminApps
                 ON adminApps.id = appAccounts.adminAppId
                    INNER JOIN adminCustomers
                    ON adminCustomers.id = appAccounts.adminCustomerId
`;

const statusArray = ["any", "active", "inactive"];

export const appAccountsCreateCtrl = async ({
  adminAppId,
  adminCustomerId,
  title,
  actionById,
  actionByName,
}) => {
  if (!adminCustomerId) {
    throw new Error("ValidationError: invalid adminCustomerId");
  }
  if (!title) {
    throw new Error("ValidationError: invalid title");
  }

  const appAccounts = {
    adminAppId,
    adminCustomerId,
    title,
    actionById,
    actionByName,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const newAppAccounts = await AppAccountModel.create(appAccounts);
  const newId =  newAppAccounts.dataValues.id;

  return await appAccountsGetOneByIdCtrl(newId);

};

export const appAccountsCreateByUserCtrl = async ({
  adminAppId,
  adminCustomerId,
  title,
  actionById,
  actionByName,
}) => {
  const transaction = await sequelize.transaction();
  try {
    if (!adminCustomerId) {
      throw new Error("ValidationError: invalid adminCustomerId");
    }
    if (!title) {
      throw new Error("ValidationError: invalid title");
    }

    const appAccounts = {
      adminAppId,
      adminCustomerId,
      title,
      actionById,
      actionByName,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newAppAccounts = await AppAccountModel.create(appAccounts, { transaction });
    const newId = newAppAccounts.dataValues.id;

    const user = await getOne({ userId: actionById }, { transaction });

    const appAccountUser = {
      adminAppId,
      adminCustomerId,
      appAccountId: newId,
      userFullName: actionByName,
      userEmail: user.primaryEmail,
      contactNumber: user.primaryPhone,
      userRole: "account-admin",
      loginUserId: actionById,
      actionById,
      actionByName,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await AppAccountUsersModel.create(appAccountUser, { transaction });

    const createdAccount = await appAccountsGetOneByIdCtrl(newId, { transaction });

    await transaction.commit();

    return createdAccount;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

//update
export const appAccountsUpdateCtrl = async ({
  id,
  title,
  actionById,
  actionByName,
}) => {
  if (!id) {
    throw new Error("ValidationError: id is required");
  }

  const existingItem = await appAccountsGetOneByIdCtrl(id);

  // Check if AppAccounts exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: AppAccounts   not found");
  }

  const appAccounts = {
    ...existingItem,
    title,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountModel.update(appAccounts, {
    where: {
      id,
    },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError:  AppAccounts not updated");
  }

  //add changes to apAccountsChanges
    const changeArray = jsonDiffArrayAction(existingItem, appAccounts);
  
    await appAccountsChangesCreateCtrl({
      itemId: id,
      actionType: "update",
      actionById,
      actionByName,
      changeArray,
    });

  return appAccounts;
};

// update status
export const appAccountsUpdateStatusCtrl = async ({
  id,
  status,
  actionById,
  actionByName,
}) => {
  if (!id) {
    throw new Error("Validation Error: ID is required.");
  }

  if (!statusArray.includes(status)) {
    throw new Error("Validation Error: Status is invalid.");
  }

  const existingItem = await appAccountsGetOneByIdCtrl(id);

  // Check if sim exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: AppAccounts  not found");
  }

  const updateAppAccounts = {
    ...existingItem,

    status,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountModel.update(updateAppAccounts, {
    where: {
      id,
    },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError: AppAccounts is not updated.");
  }

  //add changes to appAccountChanges
    const changeArray = jsonDiffArrayAction(existingItem, updateAppAccounts);
  
    await appAccountsChangesCreateCtrl({
      itemId: id,
      actionType: "update",
      actionById,
      actionByName,
      changeArray,
    });
  return updateAppAccounts;
};

// delete
export const appAccountsDeleteCtrl = async ({
  id,
  actionById,
  actionByName,
}) => {
  if (!id) {
    throw new Error("Validation Error: ID is required.");
  }

  const existingItem = await appAccountsGetOneByIdCtrl(id);

  // Check if AppAccounts exists
  if (!existingItem || existingItem.isDeleted) {
    throw new Error("IntegrityError: Missing Required fields");
  }

  const deleteAppAccounts = {
    ...existingItem,
    isDeleted: true,
    actionById,
    actionByName,
    updatedAt: new Date(),
  };

  const [isUpdated] = await AppAccountModel.update(deleteAppAccounts, {
    where: {
      id,
    },
  });

  if (!isUpdated) {
    throw new Error("IntegrityError: AppAccounts is not deleted.");
  }

  //add changes to appAccountsChanges
    const changeArray = jsonDiffArrayAction(existingItem, deleteAppAccounts);
  
    await appAccountsChangesCreateCtrl({
      itemId: id,
      actionType: "update",
      actionById,
      actionByName,
      changeArray,
    });

  return deleteAppAccounts;
};

// Getlistcontrol
export const appAccountsGetList100Ctrl = async ({ lastUpdatedAt }) => {
  const where = {
    isDeleted: false,
  };

  if (lastUpdatedAt) {
    where.updatedAt = {
      [Op.gt]: lastUpdatedAt,
    };
  }

  const list = await AppAccountModel.findAll({
    where,
    limit: 500,
    order: [["updatedAt", "DESC"]],
  });

  return list;
};


// Getlistcontrol
export const appAccountsGetList100ByCustomerCtrl = async ({ adminCustomerId }) => {

  if (!adminCustomerId) {
    throw new Error("ValidationError: adminCustomerId is required");
  }

  const sql = `
    ${SELECT_QUERY}
    WHERE appAccounts.isDeleted = 0 
      AND appAccounts.adminCustomerId = :adminCustomerId
    LIMIT 100;
     `;

  const list = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { adminCustomerId },
  });

  return list;
};

export const appAccountsGetPagedDataCtrl = async ({
  adminAppId,
  pageType = "next",
  pageLimit = 500,
  lastUpdatedAt = null,
  searchText = "",
  status = "any",
}) => {

  if (!adminAppId) {
    throw new Error("ValidationError: adminAppId is required");
  }


  if (!statusArray.includes(status)) {
    throw new Error("ValidationError: Invalid status");
  }

  const pageTypes = ["previous", "next"];

  if (!pageTypes.includes(pageType)) {
    throw new Error("appAccountsGetPagedDataModel: Invalid page type");
  }

  if (!adminAppId) {
    throw new Error("appAccountsGetPagedDataModel: adminAppId is required");
  }

  let query =
    " WHERE appAccounts.isDeleted = 0 AND appAccounts.adminAppId = :adminAppId ";
  let order = "DESC";
  if (lastUpdatedAt) {
    if (pageType === "previous") {
      query += ` AND appAccounts.updatedAt > '${lastUpdatedAt}' `;
      order = "ASC";
    } else {
      query += ` AND appAccounts.updatedAt < '${lastUpdatedAt}' `;
    }
  }

  if (status !== "any") {
    query += ` AND appAccounts.status = '${status}' `;
  }

  if (searchText !== "") {
    const searchTextSanitized = searchText.toLowerCase();
    query += ` AND (
                  LOWER(appAccounts.title) LIKE '%${searchTextSanitized}%'
                )`;
  }

  const sql = `
                ${SELECT_QUERY}
                ${query}
                ORDER BY appAccounts.updatedAt ${order}
                LIMIT ${pageLimit}
              `;

  const results = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { adminAppId },
  });

  if (pageType === "previous") {
    results.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  return results;
};


export const appAccountsGetPagedDataByAppUserCtrl = async ({
  adminAppId,
  appAccountUserId,
  pageType = "next",
  pageLimit = 500,
  lastUpdatedAt = null,
  searchText = "",
  status = "any",
}) => {
  if (!adminAppId) {
    throw new Error("ValidationError: adminAppId is required");
  }

  if (!appAccountUserId) {
    throw new Error("ValidationError: appAccountUserId is required");
  }

  if (!statusArray.includes(status)) {
    throw new Error("ValidationError: Invalid status");
  }

  const pageTypes = ["previous", "next"];

  if (!pageTypes.includes(pageType)) {
    throw new Error("appAccountsGetPagedDataModel: Invalid page type");
  }

  if (!adminAppId) {
    throw new Error("appAccountsGetPagedDataModel: adminAppId is required");
  }

  let query =
    " WHERE appAccounts.isDeleted = 0 AND appAccounts.adminAppId = :adminAppId AND appAccountUsers.loginUserId = :appAccountUserId ";
  let order = "DESC";
  if (lastUpdatedAt) {
    if (pageType === "previous") {
      query += ` AND appAccounts.updatedAt > '${lastUpdatedAt}' `;
      order = "ASC";
    } else {
      query += ` AND appAccounts.updatedAt < '${lastUpdatedAt}' `;
    }
  }

  if (status !== "any") {
    query += ` AND appAccounts.status = '${status}' `;
  }

  if (searchText !== "") {
    const searchTextSanitized = searchText.toLowerCase();
    query += ` AND (
                  LOWER(appAccounts.title) LIKE '%${searchTextSanitized}%'
                )`;
  }

  const sql = `
                ${SELECT_QUERY}
                INNER JOIN appAccountUsers ON appAccountUsers.appAccountId = appAccounts.id
                ${query}
                ORDER BY appAccounts.updatedAt ${order}
                LIMIT ${pageLimit}
              `;


  const results = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { adminAppId, appAccountUserId },
  });

  if (pageType === "previous") {
    results.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  return results;
};

export const appAccountsGetOneByIdCtrl = async (id, { transaction } = {}) => {

  if (!id) {
    throw new Error("ValidationError: id is required");
  }


  const sql = `
    ${SELECT_QUERY}
    WHERE appAccounts.id = :id
    LIMIT 1;
     `;

  const [one] = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { id },
    transaction,
  });
  return one;
};



export const appAccountsGetByUseAccountCtrl = async ({ userId, userRole = "" }) => {

  if (!userId) {
    throw new Error("ValidationError: userId is required");
  }

  const roleFilter = userRole ? `AND appAccountUsers.userRole = '${userRole}'` : "";



  const sql = `
    ${SELECT_QUERY}
    INNER JOIN appAccountUsers ON appAccounts.id = appAccountUsers.appAccountId
    WHERE appAccountUsers.loginUserId = :userId
      AND appAccounts.isDeleted = 0
      AND appAccountUsers.isDeleted = 0
      AND appAccountUsers.userRole = 'account-admin'
      ${roleFilter}
    ORDER BY appAccounts.updatedAt DESC;
     `;

  const list = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { userId },
  });
  
  return list;
};
