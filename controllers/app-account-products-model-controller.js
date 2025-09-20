import AppAccountProductsModel from "../models/app-account-products-model.js";

export const AppAccountProductsModelCreateCtrl = async (data) => {
  return await AppAccountProductsModel.create(data);
};

export const AppAccountProductsModelGetListCtrl = async ({ limit = 100, where = {} }) => {
  return await AppAccountProductsModel.findAll({ limit, where });
};

export const AppAccountProductsModelGetOneCtrl = async (where) => {
  return await AppAccountProductsModel.findOne({ where });
};

export const AppAccountProductsModelUpdateCtrl = async (data, where) => {
  return await AppAccountProductsModel.update(data, { where });
};

export const AppAccountProductsModelDeleteCtrl = async (where) => {
  return await AppAccountProductsModel.destroy({ where });
};
