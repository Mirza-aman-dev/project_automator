import fs from "fs";
import path from "path";

const __dirname = process.cwd();
const modelsDir = path.join(__dirname, "models");
const controllersDir = path.join(__dirname, "controllers");

if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir);
}

const args = process.argv.slice(2);


function toPascalCase(str) {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase());
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

function generateControllers() {
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

    if (fs.existsSync(controllerFile)) {
      console.log(`⚠️ Controller already exists: ${controllerFile}`);
      return;
    }

    const content = generateControllerContent(modelFile);
    fs.writeFileSync(controllerFile, content, "utf8");
    console.log(`✅ Generated: ${controllerFile}`);
  });
}

generateControllers();
