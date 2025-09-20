import AppAccountServiceTypesChangesModel from "../models/app-account-service-types-changes-model.js";

export const AppAccountServiceTypesChangesModelCreateCtrl = async (data) => {
  return await AppAccountServiceTypesChangesModel.create(data);
};

export const AppAccountServiceTypesChangesModelGetListCtrl = async ({ limit = 100, where = {} }) => {
  return await AppAccountServiceTypesChangesModel.findAll({ limit, where });
};

export const AppAccountServiceTypesChangesModelGetOneCtrl = async (where) => {
  return await AppAccountServiceTypesChangesModel.findOne({ where });
};

export const AppAccountServiceTypesChangesModelUpdateCtrl = async (data, where) => {
  return await AppAccountServiceTypesChangesModel.update(data, { where });
};

export const AppAccountServiceTypesChangesModelDeleteCtrl = async (where) => {
  return await AppAccountServiceTypesChangesModel.destroy({ where });
};
