import { v4 as uuidv4 } from "uuid";
import { DataTypes, QueryTypes } from "sequelize";

import cryptoHelper from "../utils/crypto-helper.js";
import sequelize from "../configs/connection.js";
import { authCreate } from "./auths-model.js";

const UsersModel = sequelize.define(
  "users",
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    primaryEmail: { type: DataTypes.STRING, allowNull: false },
    primaryPhone: { type: DataTypes.STRING },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    phoneVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verificationStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "pending" },
    role: { type: DataTypes.STRING, allowNull: false }, // basicUser, supportAdmin
    userStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "active" },
    authId: { type: DataTypes.UUID, allowNull: false },
    profilePath: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },

    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    timestamps: false,
    tableName: "users",
    indexes: [
      {
        name: "idx_users_isDeleted_status_updatedAt",
        fields: ["isDeleted", "userStatus", "updatedAt"],
      },
    ],
  }
);

export default UsersModel;

// update role
export const userUpdateRoleToSupportAdmin = async ({ id }) => {
  const userItem = await UsersModel.findByPk(id);
  if (!userItem) {
    return null;
  }

  userItem.role = 'supportAdmin';
  userItem.updatedAt = new Date();

  
  await userItem.save();
  return userItem;
}

export const userUpdateRoleCtrl = async ({ userId, role, transaction }) => {
  const userItem = await UsersModel.findByPk(userId, { transaction });
  if (!userItem) {
    throw new Error("User not found");
  }

  userItem.role = role;
  userItem.updatedAt = new Date();

  await userItem.save({ transaction });
  return userItem;
};

export const userCreate = async ({
  authId,
  fullName,
  primaryEmail,
  userRole,
  primaryPhone = "",
  emailVerified,
  verificationStatus = "pending",
}) => {
  const userId = uuidv4();
  const role = userRole || "basicUser";

  const user = {
    id: userId,
    fullName,
    primaryEmail,
    primaryPhone,
    emailVerified: emailVerified || true,
    phoneVerified: false,
    verificationStatus,
    role,
    userStatus: "active",
    authId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  const res = await UsersModel.create(user);

  if (!res) {
    throw new Error("Integrity Error: auth not created");
  }

  return user;
};

export const userCreateWithAuth = async ({ fullName, primaryEmail, primaryPhone, password }) => {
  const salt = cryptoHelper.generateSalt();
  const passwordEncrypted = cryptoHelper.hashPassword({ password, salt });

  const auth = await authCreate({ username: primaryEmail, passwordEncrypted, passwordSalt: salt });
  const res = await userCreate({
    authId: auth.id,
    fullName: fullName,
    primaryEmail: primaryEmail,
    primaryPhone: primaryPhone,
    emailVerified: false,
  });

  // check if registration is created
  if (!res) {
    throw new Error("Integrity Error: user not created");
  }

  return res;
};

export const getEmail = async ({ inviteeEmail }) => {
  try {
    const users = await sequelize.query(
      `
      SELECT *,
        DATE_FORMAT(createdAt, '%Y-%m-%d') AS createdAt, 
        DATE_FORMAT(updatedAt, '%Y-%m-%d') AS updatedAt
      FROM users
      WHERE primaryEmail = :inviteeEmail
      LIMIT 1;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { inviteeEmail },
      }
    );

    if (users.length === 0) {
      throw new Error(`No user found with email: ${inviteeEmail}`);
    }

    return users[0]; // Return the first user found
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
};

export const getOne = async ({ userId }, { transaction } = {}) => {
  try {
    const options = {
      type: QueryTypes.SELECT,
      replacements: { userId },
    };

    if (transaction) {
      options.transaction = transaction;
    }

    const users = await sequelize.query(
      `
      SELECT *,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:00.000Z') AS createdAt, 
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:00.000Z') AS updatedAt
      FROM users
      WHERE id = :userId
      LIMIT 1;
      `,
      options
    );

    if (users.length === 0) {
      throw new Error(`No user found with id: ${userId}`);
    }

    return users[0]; // Return the first user found
  } catch (error) {
    console.error("Error fetching user by id:", error);
    throw error;
  }
};

export const changeProfileImageUrl = async ({ id, imageUrl }) => {
  const userItem = await UsersModel.findByPk(id);
  if (!userItem) {
    return null;
  }

  userItem.profilePath = imageUrl;
  await userItem.save();
  return userItem;
};
