const throttle = function (ms: number) {
  let isThrottled = false;

  return (func: () => void) => {
    if (isThrottled) {
      return;
    }

    func();
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
    }, ms);
  };
};

export default throttle;
