const systemFields = [
  "id",
  "createdAt",
  "updatedAt",
  "isDeleted",
  "__typename",
];

/*
// is valid uuid 
function isValidUUID(uuid) {
  const uuidRegex = new RegExp(
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
  );
  return uuidRegex.test(uuid);
}
*/

// is valid json
function isValidJsonOrObject(json) {
  if (!json) {
    return false;
  }

  // chekc if object then return true
  if (typeof json === "object") {
    return true;
  }

  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// key: obj1 => obj2
function diffToArray(diffObj) {
  if (!isValidJsonOrObject(diffObj)) {
    return null;
  }

  const keys = Object.keys(diffObj);

  return keys.map((key) => {
    // if (key.endsWith("Id")) {
    //   return `${key}: changed`;
    // }

    const value = diffObj[key];

   
    // if (isValidUUID(value.from) || isValidUUID(value.to)) {
    //   return `${key}: changed`;
    // }

    // check if value.from or value.to is a date
    if (value.from instanceof Date || value.to instanceof Date) {
      const fromDate = value.from instanceof Date ? value.from.toISOString() : value.from;
      const toDate = value.to instanceof Date ? value.to.toISOString() : value.to;

      return `${key}: datetime => ${fromDate} => ${toDate}`;
    }

    return `${key}: ${value.from} => ${value.to}`;
  });
}

function differentJsonString(fromJson, toJson) {
  if (!isValidJsonOrObject(toJson) || !isValidJsonOrObject(fromJson)) {
    return null;
  }

  const objTo = toJson;
  const objFrom = fromJson;

  const diff = JSON.stringify(objTo, null, 2) === JSON.stringify(objFrom, null, 2);
  if (diff) {
    console.log("Both json are same");
    return "Both json are same";
  }

  const obj1Keys = Object.keys(objTo);

  const diffObj = obj1Keys.reduce((acc, key) => {
    // ignore fields that are end with id
    // if (key.endsWith("Id")) {
    //     return acc;
    // }

    // if instance of date and are equal then ignore
    if (objTo[key] instanceof Date && objFrom[key] instanceof Date) {
      if (objTo[key].toISOString() === objFrom[key].toISOString()) {
        return acc;
      }
    }

    if (systemFields.includes(key)) {
      return acc;
    }

    if (objTo[key] !== objFrom[key]) {
      return { ...acc, [key]: { to: objTo[key], from: objFrom[key] } };
    }

    return acc;
  }, {});

  return diffObj;
}

export default function jsonDiffArrayAction(fromJson, toJson) {
  const diffObj = differentJsonString(fromJson, toJson);

  if (!diffObj) {
    return null;
  }

  return diffToArray(diffObj);
}
