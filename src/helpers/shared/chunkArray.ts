export const chunkArray = <T>(array: T[], size: number) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
};
