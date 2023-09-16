export const clearTrash = (data: string): string => {
  function product(iterables: string[], repeat: number) {
    let argv = Array.prototype.slice.call(arguments),
      argc = argv.length;
    if (argc === 2 && !isNaN(argv[argc - 1])) {
      const copies = [];
      for (let i = 0; i < argv[argc - 1]; i++) {
        copies.push(argv[0].slice());
      }
      argv = copies;
    }
    return argv.reduce(
      (acc: string[], value: string[]) => {
        const tmp: string[] = [];
        acc.forEach((a0) => {
          value.forEach((a1) => {
            tmp.push(a0.concat(a1));
          });
        });
        return tmp;
      },
      [[]]
    );
  }
  function unite(arr: string[][]) {
    const final: string[] = [];
    arr.forEach((e) => {
      final.push(e.join(''));
    });
    return final;
  }
  const trashList = ['@', '#', '!', '^', '$'];
  const two = unite(product(trashList, 2));
  const tree = unite(product(trashList, 3));
  const trashCodesSet = two.concat(tree);

  const arr = data.replace('#h', '').split('//_//');
  let trashString = arr.join('');

  trashCodesSet.forEach(function (i) {
    const temp = btoa(i);
    trashString = trashString.replaceAll(temp, '');
  });

  return atob(trashString);
};
