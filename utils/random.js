// Generate a random number and format it with spaces
export const generateRandomNumber = (length = 6) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }

  // Format the result
  const formattedVerificationCode = `${result.slice(0, 2)} ${result.slice(2, 4)} ${result.slice(4)}`;

  return formattedVerificationCode;
};

// Generate a random 32 character and number string both uppercase and lowercase
export const generateRandomString = (length = 32) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

// get 8 digit random number
export function getRandomNumber8Digit() {
  return Math.floor(Math.random() * 90000000) + 10000000;
}
