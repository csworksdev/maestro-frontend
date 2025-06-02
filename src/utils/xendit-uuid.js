import { v4 as uuidv4 } from "uuid";

export const generateExternalId = () => {
  const externalId = `macox-${uuidv4()}`;
  return externalId;
};
