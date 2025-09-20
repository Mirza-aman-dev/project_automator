import AppAccountServiceTypesModel from "../models/app-account-service-types-model.js";

export const AppAccountServiceTypesModelCreateCtrl = async (data) => {
  return await AppAccountServiceTypesModel.create(data);
};

export const AppAccountServiceTypesModelGetListCtrl = async ({ limit = 100, where = {} }) => {
  return await AppAccountServiceTypesModel.findAll({ limit, where });
};

export const AppAccountServiceTypesModelGetOneCtrl = async (where) => {
  return await AppAccountServiceTypesModel.findOne({ where });
};

export const AppAccountServiceTypesModelUpdateCtrl = async (data, where) => {
  return await AppAccountServiceTypesModel.update(data, { where });
};

export const AppAccountServiceTypesModelDeleteCtrl = async (where) => {
  return await AppAccountServiceTypesModel.destroy({ where });
};
