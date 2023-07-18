export const timemarkToSeconds=(timemark:string)=>{
  const [time]=timemark.split(".")
  return time.split(':').reduce((acc, time) => 60 * acc + +time, 0);
}
