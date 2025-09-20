import AppAccountsChangesModel from "../models/app-accounts-changes-model.js";

export const appAccountsChangesCreateCtrl = async ({
  itemId,
  actionType = "update",
  changeArray,
  actionById,
  actionByName,
}) => {
  await AppAccountsChangesModel.create({
    itemId,
    actionType,
    changeArray,
    actionById,
    actionByName,
  });
};

export const appAccountsChangesGetList100Ctrl = async ({ itemId }) => {
  const list = await AppAccountsChangesModel.findAll({
    limit: 100,
    where: { itemId },
    raw: true,
    order: [["actionAt", "DESC"]],
  });

  return list;
};
