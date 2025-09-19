import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function modelToControllerName(modelFileName) {
  return modelFileName.replace("-model.js", "-ctrl.js");
}

function extractModelName(fileContent) {
  const match = fileContent.match(/export default (.+);/);
  return match ? match[1] : null;
}

app.post("/generate-controller", (req, res) => {
  const { modelFileName } = req.body;

  if (!modelFileName) {
    return res.status(400).json({ error: "modelFileName is required" });
  }

  const modelPath = path.join(__dirname, "models", modelFileName);
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({ error: "Model file not found" });
  }

  const fileContent = fs.readFileSync(modelPath, "utf-8");
  const modelName = extractModelName(fileContent);

  if (!modelName) {
    return res.status(500).json({ error: "Could not parse model export" });
  }

  const controllerFileName = modelToControllerName(modelFileName);
  const controllerPath = path.join(__dirname, "controllers", controllerFileName);

  const controllerContent = `import ${modelName} from "../models/${modelFileName}";

export const ${modelName}CreateCtrl = async (data) => {
  return await ${modelName}.create(data);
};

export const ${modelName}GetListCtrl = async ({ limit = 100, where = {} }) => {
  return await ${modelName}.findAll({
    limit,
    where,
    raw: true,
    order: [["actionAt", "DESC"]],
  });
};

export const ${modelName}GetByIdCtrl = async (id) => {
  return await ${modelName}.findByPk(id, { raw: true });
};

export const ${modelName}UpdateCtrl = async (id, updateData) => {
  return await ${modelName}.update(updateData, { where: { id } });
};

export const ${modelName}DeleteCtrl = async (id) => {
  return await ${modelName}.destroy({ where: { id } });
};
`;


  fs.writeFileSync(controllerPath, controllerContent);

  res.json({
    message: "Controller generated successfully",
    controllerFile: controllerFileName,
  });
});


const PORT = 4000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
