import fs from "fs";
import path from "path";

const __dirname = process.cwd();
const modelsDir = path.join(__dirname, "models");
const controllersDir = path.join(__dirname, "controllers");
const gqlDir = path.join(__dirname, "gql");

if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir);
if (!fs.existsSync(gqlDir)) fs.mkdirSync(gqlDir);

const args = process.argv.slice(2);

function toPascalCase(str) {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function generateControllerContent(modelFile) {
  const baseName = path.basename(modelFile, ".js");
  const pascalName = toPascalCase(baseName);
  const modelImport = `import ${pascalName} from "../models/${baseName}.js";`;

  return `\
${modelImport}

export const ${pascalName}CreateCtrl = async (data) => {
  return await ${pascalName}.create(data);
};

export const ${pascalName}GetListCtrl = async ({ limit = 100, where = {} }) => {
  return await ${pascalName}.findAll({ limit, where });
};

export const ${pascalName}GetOneCtrl = async (where) => {
  return await ${pascalName}.findOne({ where });
};

export const ${pascalName}UpdateCtrl = async (data, where) => {
  return await ${pascalName}.update(data, { where });
};

export const ${pascalName}DeleteCtrl = async (where) => {
  return await ${pascalName}.destroy({ where });
};
`;
}

function generateGqlContent(modelFile) {
  const baseName = path.basename(modelFile, ".js");
  const pascalName = toPascalCase(baseName);        
  const camelName = toCamelCase(baseName);          

  return `\
import gql from "graphql-tag";

import { authReadUserToken } from "../models/auths-model.js";
import { graphqlPubsub } from "../gql-server/pubsub.js";

import {
  ${pascalName}CreateCtrl,
  ${pascalName}GetListCtrl,
  ${pascalName}GetOneCtrl,
  ${pascalName}UpdateCtrl,
  ${pascalName}DeleteCtrl,
} from "../controllers/${baseName}-controller.js";

const typeDef = gql\`
  type ${pascalName} {
    id: ID!
    # TODO: Add your model fields here
  }

  type Query {
    ${camelName}GetOne(userToken: String!, id: ID!): ${pascalName}
    ${camelName}GetList(userToken: String!): [${pascalName}]!
  }

  type Mutation {
    ${camelName}Create(userToken: String!, input: String!): ${pascalName}!
    ${camelName}Update(userToken: String!, id: ID!, input: String!): ${pascalName}!
    ${camelName}Delete(userToken: String!, id: ID!): Boolean!
  }

  type Subscription {
    ${camelName}Changes(userToken: String!): ${pascalName}
  }
\`;

// Example resolvers
const resolvers = {
  Query: {
    ${camelName}GetOne: async (parent, args) => {
      const { userToken, id } = args;
      const actionUser = authReadUserToken(userToken);
      if (!actionUser) throw new Error("Invalid user token");
      return await ${pascalName}GetOneCtrl({ id });
    },
    ${camelName}GetList: async (parent, args) => {
      const { userToken } = args;
      const actionUser = authReadUserToken(userToken);
      if (!actionUser) throw new Error("Invalid user token");
      return await ${pascalName}GetListCtrl({ limit: 100 });
    },
  },
  Mutation: {
    ${camelName}Create: async (parent, args) => {
      const { userToken, input } = args;
      const actionUser = authReadUserToken(userToken);
      if (!actionUser) throw new Error("Invalid user token");
      return await ${pascalName}CreateCtrl(JSON.parse(input));
    },
    ${camelName}Update: async (parent, args) => {
      const { userToken, id, input } = args;
      const actionUser = authReadUserToken(userToken);
      if (!actionUser) throw new Error("Invalid user token");
      return await ${pascalName}UpdateCtrl(JSON.parse(input), { id });
    },
    ${camelName}Delete: async (parent, args) => {
      const { userToken, id } = args;
      const actionUser = authReadUserToken(userToken);
      if (!actionUser) throw new Error("Invalid user token");
      await ${pascalName}DeleteCtrl({ id });
      return true;
    },
  },
  Subscription: {
    ${camelName}Changes: {
      subscribe: (parent, args) => {
        const { userToken } = args;
        const actionUser = authReadUserToken(userToken);
        if (!actionUser) throw new Error("Invalid user token");
        return graphqlPubsub.asyncIterator("${camelName}Changes");
      },
    },
  },
};

export default { resolvers, typeDef };
`;
}

function generateFiles() {
  let modelFiles;

  if (args.length > 0) {
    modelFiles = args.map((name) => `${name}.js`);
  } else {
    modelFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".js"));
  }

  modelFiles.forEach((modelFile) => {

    const controllerFile = path.join(
      controllersDir,
      modelFile.replace(".js", "-controller.js")
    );
    if (!fs.existsSync(controllerFile)) {
      const controllerContent = generateControllerContent(modelFile);
      fs.writeFileSync(controllerFile, controllerContent, "utf8");
      console.log(`✅ Controller generated: ${controllerFile}`);
    } else {
      console.log(`⚠️ Controller already exists: ${controllerFile}`);
    }

    const gqlFile = path.join(
      gqlDir,
      modelFile.replace(".js", "-gql.js")
    );
    if (!fs.existsSync(gqlFile)) {
      const gqlContent = generateGqlContent(modelFile);
      fs.writeFileSync(gqlFile, gqlContent, "utf8");
      console.log(`✅ GQL generated: ${gqlFile}`);
    } else {
      console.log(`⚠️ GQL already exists: ${gqlFile}`);
    }
  });
}

generateFiles();
