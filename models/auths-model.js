import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from "uuid";
import moment from 'moment';
import jwt from "jsonwebtoken";

import sequelize from '../configs/connection.js';
import { sendVerificationEmail} from "../services/create-mail-verification.js"
import UsersModel from './users-model.js';
import { generateRandomNumber } from "../utils/random.js";

const JWT_SECRET = process.env.JWT_SECRET;

const AuthModel = sequelize.define(
    'auths',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordEncrypted: { type: DataTypes.STRING, allowNull: false },
      passwordSalt: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
 
      verificationCode: { type: DataTypes.STRING, allowNull: true }, // 6 digits number
      verificationCodeExpiresAt: { type: DataTypes.DATE, allowNull: true }, // 10 minutes
      verificationCodeSentAt: { type: DataTypes.DATE, allowNull: true },
      verificationStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "pending" },
      verificationAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // 5 attempts

      failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lockoutUntil: { type: DataTypes.DATE, allowNull: true },
      lockoutCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
      timestamps: false,
      tableName: 'auths',
      indexes: [
        {
          name: 'idx_auths_status',
          fields: ['username', 'status']
        }
      ]

    }
  );

  export default AuthModel;

  export const authCreate = async ({ username, passwordSalt, passwordEncrypted }, transaction) => {

    // check if username already exists
    const anyAuths = await AuthModel.findOne({ where: { username }, raw: true });
    if (anyAuths) {
      throw new Error("Integrity Error: username already exists");
    }
  
    const auth = {
      id: uuidv4(),
      username,
      passwordEncrypted,
      passwordSalt,
      status: "active",
      createdAt: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
      updatedAt: null,
    };

    const res = await AuthModel.create(auth, { transaction });
  
    if (!res) {
      throw new Error("Integrity Error: auth not created");
    }
  
    delete auth.passwordEncrypted;
    delete auth.passwordSalt;
  
    return auth;
  };


  export const authReadUserToken = (userToken) => {
    return jwt.verify(userToken, JWT_SECRET);
  };
 
  export const generateVerificationCode = async (username) => {
    const auth = await AuthModel.findOne({ where: { username, status: "active" } });
    const user = await UsersModel.findOne({ where: { authId: auth.id }, raw: true });
  
    if (!auth) {
      throw new Error(`No user found with username: ${username}`);
    }
  
    if (auth.verificationAttempts >= 20) {
      throw new Error('Maximum number of verification attempts reached.');
    }
  
    
    const verificationCode = generateRandomNumber(6);
    const verificationCodeExpiresAt = moment().add(10, 'minutes').toDate();

    const fullName = user.fullName || 'User';
  
    auth.verificationCode = verificationCode;
    auth.verificationCodeExpiresAt = verificationCodeExpiresAt;
    auth.verificationStatus = "pending";
    auth.verificationAttempts = (auth.verificationAttempts || 0) + 1; 
    auth.verificationCodeSentAt = moment().toDate();
    await auth.save();
  
    await sendVerificationEmail(username, verificationCode, fullName, 'Verify code');
    return auth;
  };
