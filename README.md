## 📂 Project Structure
project-root/
│── models/
│ └── app-account-service-types-changes-model.js
│── controllers/
│ └── # auto-genrated 
│── server.js


run :
curl -X POST http://localhost:4000/generate-controller \
-H "Content-Type: application/json" \
-d '{"modelFileName": "app-account-service-types-changes-model.js"}'


if success :
{"message":"Controller generated successfully","controllerFile":"app-account-service-types-changes-ctrl.js"}
