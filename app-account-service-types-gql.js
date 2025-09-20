import gql from "graphql-tag";

import { authReadUserToken } from "../models/auths-model.js";
import { graphqlPubsub } from "../gql-server/pubsub.js";

import {
  appAccountServiceTypesGetOneByIdCtrl,
  appAccountServiceTypesGetPagedDataByAccountUserCtrl,
  appAccountServiceTypesCreateCtrl,
  appAccountServiceTypesUpdateCtrl,
  appAccountServiceTypesUpdateStatusCtrl,
  appAccountServiceTypesDeleteCtrl,
} from "../ctrl/app-account-service-types-ctrl.js";

const typeDef = gql`
  type AppAccountServiceTypes {
    id: ID!
    adminAppId: ID!
    adminAppName: String
    adminCustomerId: ID!
    adminCustomerName: String
    appAccountId: ID!
    appAccountTitle: String
    typeName: String!
    category: String
    imagePath: String
    note: String
    status: String!
    actionById: ID!
    actionByName: String
    createdAt: Date!
    updatedAt: Date!
    isDeleted: Boolean!
  }

  type AppAccountServiceTypeSubscriptionPayload {
    item: AppAccountServiceTypes!
    actionType: String!
    changeArray: [String]
  }

  type Query {
    appAccountServiceTypesGetOneById(userToken: String!, id: ID!): AppAccountServiceTypes!

    appAccountServiceTypesGetPagedDataByAccountUser(
      userToken: String!
      appAccountId: String!
      pageType: String
      pageLimit: Int
      lastUpdatedAt: String
      searchText: String
      status: String
    ): [AppAccountServiceTypes]!
  }

  type Mutation {
    appAccountServiceTypesCreate(
      userToken: String!
      appAccountId: ID!
      typeName: String!
      category: String
      note: String
    ): AppAccountServiceTypes!

    appAccountServiceTypesUpdate(
      userToken: String!
      id: ID!
      typeName: String
      category: String
      note: String
    ): AppAccountServiceTypes!

    appAccountServiceTypesUpdateStatus(userToken: String!, id: ID!, status: String!): AppAccountServiceTypes!

    appAccountServiceTypesDelete(userToken: String!, id: ID!): AppAccountServiceTypes!
  }

  type Subscription {
    appAccountServiceTypeChanges(userToken: String!, appAccountId: ID!): AppAccountServiceTypeSubscriptionPayload!
  }
`;

// Get one service type by ID
const appAccountServiceTypesGetOneById = async (parent, args) => {
  const { userToken, id } = args;

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const one = await appAccountServiceTypesGetOneByIdCtrl(id);
  return one;
};

// Get paged data by account user
const appAccountServiceTypesGetPagedDataByAccountUser = async (parent, args) => {
  const { userToken, appAccountId, pageType, pageLimit, lastUpdatedAt, searchText, status } = args;

  // if pageLimit is more than 500
  if (pageLimit > 500) {
    throw new Error("ValidationError: pageLimit should be less than or equal to 500");
  }

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  // Check if actionUser.role is app-user (account users can view their own account service types)
  if (actionUser.role !== "app-user" && actionUser.role !== "supportAdmin") {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const pagedData = await appAccountServiceTypesGetPagedDataByAccountUserCtrl({
    appAccountId,
    pageType,
    pageLimit,
    lastUpdatedAt,
    searchText,
    status,
  });

  return pagedData;
};

// Create service type
const appAccountServiceTypesCreate = async (parent, args) => {
  const { userToken, appAccountId, typeName, category, imagePath, note, status } = args;

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  // Check if actionUser.role is supportAdmin
  if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const one = await appAccountServiceTypesCreateCtrl({
    appAccountId,
    typeName,
    category,
    imagePath,
    note,
    status,
    actionById: actionUser.userId,
    actionByName: actionUser.fullName,
  });

  return one;
};

// Update service type
const appAccountServiceTypesUpdate = async (parent, args) => {
  const { userToken, id, typeName, category, note } = args;

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const updateItem = await appAccountServiceTypesUpdateCtrl({
    id,
    typeName,
    category,
    note,
    actionById: actionUser.userId,
    actionByName: actionUser.fullName,
  });

  return updateItem;
};

// Update service type status
const appAccountServiceTypesUpdateStatus = async (parent, args) => {
  const { userToken, id, status } = args;

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const updateItem = await appAccountServiceTypesUpdateStatusCtrl({
    id,
    status,
    actionById: actionUser.userId,
    actionByName: actionUser.fullName,
  });

  return updateItem;
};

// Delete service type
const appAccountServiceTypesDelete = async (parent, args) => {
  const { userToken, id } = args;

  const actionUser = authReadUserToken(userToken);
  if (!actionUser) {
    throw new Error("AuthError: invalid user token");
  }

  if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
    throw new Error("PermissionError: user not authorized to perform this action");
  }

  const deleteItem = await appAccountServiceTypesDeleteCtrl({
    id,
    actionById: actionUser.userId,
    actionByName: actionUser.fullName,
  });

  return deleteItem;
};

// Subscription for service type changes
const appAccountServiceTypeChanges = {
  subscribe: async (parent, args) => {
    const { userToken, appAccountId } = args;

    // Validate user token
    const actionUser = authReadUserToken(userToken);
    if (!actionUser) {
      throw new Error("AuthError: invalid user token");
    }

    if (!["supportAdmin", "app-user"].includes(actionUser.role)) {
      throw new Error("PermissionError: user not authorized");
    }

    // Create subscription topic for this specific app account
    const subscriptionTopic = `appAccountServiceType_${appAccountId}`;

    return graphqlPubsub.asyncIterator(subscriptionTopic);
  },
};

const resolvers = {
  Query: {
    appAccountServiceTypesGetOneById,
    appAccountServiceTypesGetPagedDataByAccountUser,
  },
  Mutation: {
    appAccountServiceTypesCreate,
    appAccountServiceTypesUpdate,
    appAccountServiceTypesUpdateStatus,
    appAccountServiceTypesDelete,
  },
  Subscription: {
     appAccountServiceTypeChanges,
  },
};

export default {
  resolvers,
  typeDef,
};
