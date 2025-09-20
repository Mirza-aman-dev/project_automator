import AppAccountServiceTypesChangesModel from "../models/app-account-service-types-changes-model.js";

export const appAccountServiceTypesChangesCreateCtrl = async ({
  itemId,
  actionType = "update",
  changeArray,
  actionById,
  actionByName,
}) => {
  await AppAccountServiceTypesChangesModel.create({
    itemId,
    actionType,
    changeArray,
    actionById,
    actionByName,
  });
};

export const appAccountServiceTypesChangesGetList100Ctrl = async ({ itemId }) => {
  const list = await AppAccountServiceTypesChangesModel.findAll({
    limit: 100,
    where: { itemId },
    raw: true,
    order: [["actionAt", "DESC"]],
  });

  return list;
};
