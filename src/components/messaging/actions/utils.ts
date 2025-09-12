export const isNomeeAction = (data: string): boolean => {
  if (data.startsWith("prompt_listing::")) return true;
  return false;
};
