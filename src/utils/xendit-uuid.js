import { v4 as uuidv4 } from "uuid";

export const generateExternalId = () => {
  const externalId = `MSSC-${uuidv4()}`;
  return externalId;
};
