## 📂 Project Structure
<img width="439" height="147" alt="Screenshot 2025-09-19 at 8 38 47 PM" src="https://github.com/user-attachments/assets/269c5c2f-0290-407c-84d6-5fcb16d09cd2" />

---

## Run

To generate a controller file from a model, run:

```bash
curl -X POST http://localhost:4000/generate-controller \
-H "Content-Type: application/json" \
-d '{"modelFileName": "app-account-service-types-changes-model.js"}'
